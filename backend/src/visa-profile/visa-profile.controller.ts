// backend/src/visa-profile/visa-profile.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
  ParseIntPipe,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { VisaProfileService } from "./visa-profile.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { buildSoYeuLyLichDocx } from "./templates/cv-vn.docx"; // <- bạn tạo file này ở backend

@UseGuards(JwtAuthGuard)
@Controller("cases/:caseId/visa-profile")
export class VisaProfileController {
  constructor(
    private readonly service: VisaProfileService,
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // Helpers
  // =========================
  private toNullIfEmpty(v: any): string | null {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  }

  private toIntOrNull(v: any): number | null {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }

  private toDateOrNull(v: any): Date | null {
    if (v === undefined || v === null || v === "") return null;
    // frontend thường gửi yyyy-mm-dd
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private toJsonArray(v: any): any[] {
    if (Array.isArray(v)) return v;
    if (v === null || v === undefined || v === "") return [];
    // nếu frontend lỡ gửi string JSON
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private sanitize(body: any) {
    // ✅ chỉ lấy field mà DB có (tránh Prisma ValidationError)
    // ✅ ép kiểu đúng (date/int/null)
    return {
      phone: this.toNullIfEmpty(body?.phone),
      email: this.toNullIfEmpty(body?.email),
      homeAddress: this.toNullIfEmpty(body?.homeAddress),
      heightCm: this.toIntOrNull(body?.heightCm),
      eyeColor: this.toNullIfEmpty(body?.eyeColor),
      religion: this.toNullIfEmpty(body?.religion),
      maritalStatus: this.toNullIfEmpty(body?.maritalStatus),
      marriageDate: this.toDateOrNull(body?.marriageDate),
      divorceDate: this.toDateOrNull(body?.divorceDate),
      currentCompany: this.toNullIfEmpty(body?.currentCompany),
      companyAddress: this.toNullIfEmpty(body?.companyAddress),
      graduatedSchool: this.toNullIfEmpty(body?.graduatedSchool),
      major: this.toNullIfEmpty(body?.major),
      bigAssets: this.toNullIfEmpty(body?.bigAssets),

      familyMembers: this.toJsonArray(body?.familyMembers),
      familyJobsIncome: this.toJsonArray(body?.familyJobsIncome),
      travelHistory: this.toJsonArray(body?.travelHistory),
      educationHistory: this.toJsonArray(body?.educationHistory),
      workHistory: this.toJsonArray(body?.workHistory),
    };
  }

  // =========================
  // API
  // =========================

  // GET /cases/:caseId/visa-profile
  @Get()
  async get(@Param("caseId", ParseIntPipe) caseId: number) {
    // trả về null nếu chưa có, frontend sẽ dùng defaultForm
    return this.service.getByCaseId(caseId);
  }

  // PUT /cases/:caseId/visa-profile
  @Put()
  async save(
    @Param("caseId", ParseIntPipe) caseId: number,
    @Body() body: any,
  ) {
    const data = this.sanitize(body);
    return this.service.upsert(caseId, data);
  }

  // GET /cases/:caseId/visa-profile/so-yeu-ly-lich.docx
  @Get("so-yeu-ly-lich.docx")
  async downloadSoYeuLyLich(
    @Param("caseId", ParseIntPipe) caseId: number,
    @Res() res: Response,
  ) {
    const caseData = await this.prisma.case.findUniqueOrThrow({
      where: { id: caseId },
    });

    const profile =
      (await this.service.getByCaseId(caseId)) ?? ({} as any);

    const buffer = await buildSoYeuLyLichDocx(caseData, profile);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="so-yeu-ly-lich_case-${caseId}.docx"`,
    );

    return res.send(buffer);
  }
}
