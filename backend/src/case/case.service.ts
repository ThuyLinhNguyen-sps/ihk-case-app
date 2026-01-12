import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IHK_CHECKLIST_TEMPLATE } from "./checklist.template";
import { DocType, VisaStatus } from "@prisma/client";

import { uploadToR2, deleteFromR2 } from "../storage/r2.service";

function toVisaStatus(input?: string | null): VisaStatus | null | undefined {
  if (input === undefined) return undefined;
  if (input === null) return null;

  const raw = String(input).trim();
  if (!raw) return undefined;

  // allow enum keys from frontend (HOAN_TAT, VAN_THIEU_HO_SO...)
  const upper = raw.toUpperCase();
  const enumKeys = Object.keys(VisaStatus) as Array<keyof typeof VisaStatus>;
  if ((enumKeys as string[]).includes(upper)) {
    return VisaStatus[upper as keyof typeof VisaStatus];
  }

  // map Vietnamese -> enum
  const vnMap: Record<string, VisaStatus> = {
    "hoàn tất": VisaStatus.HOAN_TAT,
    "hoan tat": VisaStatus.HOAN_TAT,

    "vẫn thiếu hồ sơ": VisaStatus.VAN_THIEU_HO_SO,
    "van thieu ho so": VisaStatus.VAN_THIEU_HO_SO,

    "đã lăn tay": VisaStatus.DA_LAN_TAY,
    "da lan tay": VisaStatus.DA_LAN_TAY,

    "đã có visum": VisaStatus.DA_CO_VISUM,
    "da co visum": VisaStatus.DA_CO_VISUM,

    "chưa đủ 8 tháng": VisaStatus.CHUA_DU_8_THANG,
    "chua du 8 thang": VisaStatus.CHUA_DU_8_THANG,
  };

  const key = raw.toLowerCase();
  return vnMap[key] ?? undefined;
}

const DEFAULT_CUSTOM_DOCS: Array<{ title: string; required: boolean }> = [
  { title: "Visum", required: true },
  { title: "Hộ chiếu", required: true },
  { title: "EZB", required: false },
  { title: "Zusatz D", required: false },
  { title: "Arbeitsvertrag", required: true },
  { title: "IHK", required: false },
  { title: "Ngày nhập cảnh", required: false },
];

@Injectable()
export class CaseService {
  constructor(private prisma: PrismaService) {}

  // ✅ Create Case (case + default checklist + default custom docs + visaStatus)
  async create(data: {
    fullName: string;
    dob?: string;
    jobTitle?: string;
    phone?: string;
    city?: string;
    visaStatus?: string;
  }) {
    const created = await this.prisma.case.create({
      data: {
        fullName: data.fullName,
        dob: data.dob ? new Date(data.dob) : undefined,
        jobTitle: data.jobTitle ?? null,
        phone: data.phone ?? null,
        city: data.city ?? null,
        visaStatus: toVisaStatus(data.visaStatus) ?? VisaStatus.VAN_THIEU_HO_SO,
      },
    });

    // default IHK checklist (CaseDocument)
    await this.prisma.caseDocument.createMany({
      data: IHK_CHECKLIST_TEMPLATE.map((doc) => ({
        caseId: created.id,
        type: doc.type,
        required: doc.required,
        translationRequired: doc.translationRule === "DE_REQUIRED",
      })),
      skipDuplicates: true,
    });

    // default custom docs
    await this.ensureDefaultCustomDocs(created.id);

    return created;
  }

  // ✅ List cases (include fields)
  findAll() {
    return this.prisma.case.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        fullName: true,
        dob: true,
        jobTitle: true,
        phone: true,
        city: true,
        visaStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ✅ UPDATE (PATCH /cases/:id)
  async updateCase(
    caseId: number,
    data: {
      fullName?: string;
      dob?: string;
      jobTitle?: string;
      phone?: string;
      city?: string;
      visaStatus?: string;
    },
  ) {
    const c = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException(`Case ${caseId} not found`);

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        fullName: data.fullName ?? undefined,
        dob: data.dob ? new Date(data.dob) : undefined,
        jobTitle: data.jobTitle ?? undefined,
        phone: data.phone ?? undefined,
        city: data.city ?? undefined,
        visaStatus: toVisaStatus(data.visaStatus),
      },
    });
  }

  // ✅ ensure default IHK checklist exists
  private async ensureChecklist(caseId: number) {
    const count = await this.prisma.caseDocument.count({ where: { caseId } });
    if (count > 0) return;

    await this.prisma.caseDocument.createMany({
      data: IHK_CHECKLIST_TEMPLATE.map((doc) => ({
        caseId,
        type: doc.type,
        required: doc.required,
        translationRequired: doc.translationRule === "DE_REQUIRED",
      })),
      skipDuplicates: true,
    });
  }

  // ✅ ensure default custom docs exist (for old cases too)
  private async ensureDefaultCustomDocs(caseId: number) {
    const existing = await this.prisma.customDocument.findMany({
      where: { caseId },
      select: { title: true },
    });
    const existSet = new Set(existing.map((x) => x.title.trim().toLowerCase()));

    const toCreate = DEFAULT_CUSTOM_DOCS.filter(
      (d) => !existSet.has(d.title.trim().toLowerCase()),
    ).map((d) => ({
      caseId,
      title: d.title,
      required: d.required,
    }));

    if (toCreate.length > 0) {
      await this.prisma.customDocument.createMany({ data: toCreate });
    }
  }

  // ✅ Checklist: return both default docs + custom docs
  async getChecklist(caseId: number) {
    const c = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException(`Case ${caseId} not found`);

    await this.ensureChecklist(caseId);
    await this.ensureDefaultCustomDocs(caseId);

    const docs = await this.prisma.caseDocument.findMany({
      where: { caseId },
      orderBy: { id: "asc" },
    });

    const customDocs = await this.prisma.customDocument.findMany({
      where: { caseId },
      orderBy: { id: "asc" },
    });

    const missingRequiredDefault = docs.filter((d) => d.required && !d.filePath).length;
    const missingRequiredCustom = customDocs.filter((d) => d.required && !d.filePath).length;

    return {
      caseId,
      missingRequired: missingRequiredDefault + missingRequiredCustom,
      documents: docs,
      customDocuments: customDocs,
    };
  }

  // ✅ Add custom document row (ADMIN/STAFF)
  async addCustomDocument(caseId: number, data: { title: string; required?: boolean }) {
    const c = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException(`Case ${caseId} not found`);

    const title = (data.title ?? "").trim();
    if (!title) throw new BadRequestException("title is required");

    return this.prisma.customDocument.create({
      data: {
        caseId,
        title,
        required: !!data.required,
      },
    });
  }

  private parseDocType(type: string): DocType {
    let docKey = String(type ?? "").toUpperCase();
    if (docKey === "PASSPORT") docKey = "IDENTITY_PROOF";

    if (!Object.keys(DocType).includes(docKey)) {
      throw new BadRequestException(`Invalid document type: ${type}`);
    }

    return DocType[docKey as keyof typeof DocType];
  }

  // =========================
  // UPLOAD (DEFAULT DOCS) -> R2
  // =========================
  async attachDocument(
    caseId: number,
    type: string,
    file: Express.Multer.File,
    userId?: number,
  ) {
    const caseExists = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseExists) throw new NotFoundException(`Case ${caseId} not found`);

    await this.ensureChecklist(caseId);

    const docType = this.parseDocType(type);

    if (!file?.buffer) throw new BadRequestException("File buffer missing");

    // ✅ upload to R2
    const key = `case-${caseId}/default/${docType}/${Date.now()}-${file.originalname}`;
    await uploadToR2(key, file.buffer, file.mimetype);

    // ✅ DB stores key (NOT local path)
    const updated = await this.prisma.caseDocument.upsert({
      where: { caseId_type: { caseId, type: docType } },
      update: {
        fileName: file.originalname,
        filePath: key,
   
        uploadedBy: userId ?? null,
      },
      create: {
        caseId,
        type: docType,
        required: true, // fallback
        fileName: file.originalname,
        filePath: key,
       
        uploadedBy: userId ?? null,
      },
    });

    const docs = await this.prisma.caseDocument.findMany({ where: { caseId } });
    const missingRequired = docs.filter((d) => d.required && !d.filePath).length;

    return { message: "Upload successful", document: updated, missingRequired };
  }

  // ✅ Download default doc file (any role) -> return R2 key
  async getDocumentFile(caseId: number, type: string) {
    const docType = this.parseDocType(type);

    const doc = await this.prisma.caseDocument.findUnique({
      where: { caseId_type: { caseId, type: docType } },
      select: { filePath: true, fileName: true },
    });

    if (!doc || !doc.filePath) throw new NotFoundException("File not found for this document type");

    return { filePath: doc.filePath, fileName: doc.fileName ?? null };
  }

  // =========================
  // UPLOAD (CUSTOM DOCS) -> R2
  // =========================
  async attachCustomDocumentFile(
    caseId: number,
    docId: number,
    file: Express.Multer.File,
    userId?: number,
  ) {
    const doc = await this.prisma.customDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.caseId !== caseId) throw new NotFoundException("Document not found");

    if (!file?.buffer) throw new BadRequestException("File buffer missing");

    // ✅ upload to R2
    const key = `case-${caseId}/custom/${docId}/${Date.now()}-${file.originalname}`;
    await uploadToR2(key, file.buffer, file.mimetype);

    // (Optional) delete old file on R2 to avoid trash
    if (doc.filePath) {
      try {
        await deleteFromR2(doc.filePath);
      } catch {
        // ignore
      }
    }

    return this.prisma.customDocument.update({
      where: { id: docId },
      data: {
        fileName: file.originalname,
        filePath: key,
        uploadedAt: new Date(),
        uploadedBy: userId ?? null,
      },
    });
  }

  // ✅ Download custom doc file (any role) -> return R2 key
  async getCustomDocumentFile(caseId: number, docId: number) {
    const doc = await this.prisma.customDocument.findUnique({
      where: { id: docId },
      select: { caseId: true, filePath: true, fileName: true },
    });

    if (!doc || doc.caseId !== caseId || !doc.filePath) throw new NotFoundException("File not found");

    return { filePath: doc.filePath, fileName: doc.fileName ?? null };
  }

  // ✅ Delete custom document row (ADMIN/STAFF) + delete file in R2 (if any)
  async deleteCustomDocument(caseId: number, docId: number) {
    const doc = await this.prisma.customDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.caseId !== caseId) throw new NotFoundException("Document not found");

    if (doc.filePath) {
      try {
        await deleteFromR2(doc.filePath);
      } catch {
        // ignore
      }
    }

    return this.prisma.customDocument.delete({ where: { id: docId } });
  }

  // ✅ DELETE CASE + remove children + delete all R2 objects referenced
  async deleteCase(caseId: number) {
    const c = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!c) throw new NotFoundException(`Case ${caseId} not found`);

    // collect keys to delete in R2
    const defaultDocs = await this.prisma.caseDocument.findMany({
      where: { caseId },
      select: { filePath: true },
    });
    const customDocs = await this.prisma.customDocument.findMany({
      where: { caseId },
      select: { filePath: true },
    });

    const keys = [
      ...defaultDocs.map((d) => d.filePath).filter(Boolean),
      ...customDocs.map((d) => d.filePath).filter(Boolean),
    ] as string[];

    // delete DB rows
    await this.prisma.caseDocument.deleteMany({ where: { caseId } });
    await this.prisma.customDocument.deleteMany({ where: { caseId } });
    await this.prisma.case.delete({ where: { id: caseId } });

    // delete R2 objects (best-effort)
    await Promise.all(
      keys.map(async (k) => {
        try {
          await deleteFromR2(k);
        } catch {
          // ignore
        }
      }),
    );

    return { ok: true, deletedId: caseId };
  }
}
