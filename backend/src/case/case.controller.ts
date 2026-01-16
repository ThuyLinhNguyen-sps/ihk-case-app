import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { FileInterceptor } from "@nestjs/platform-express";

import { CaseService } from "./case.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Role } from "../auth/role.enum";

import { downloadFromR2 } from "../storage/r2.service";

@Controller("cases")
export class CaseController {
  constructor(private readonly service: CaseService) {}

  // ✅ Create Case: ADMIN only (đổi thành ADMIN+STAFF nếu bạn muốn)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      dob?: string;
      jobTitle?: string;
      phone?: string;
      city?: string;
      visaStatus?: string;
      restaurantName?: string;

    },
  ) {
    return this.service.create(body);
  }

  // ✅ List cases: any logged-in user
  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.service.findAll();
  }

  // ✅ Checklist: any logged-in user
  @UseGuards(JwtAuthGuard)
  @Get(":id/checklist")
  getChecklist(@Param("id") id: string) {
    return this.service.getChecklist(Number(id));
  }

  // =========================
  // DEFAULT DOCS (CaseDocument)
  // =========================

  // ✅ Upload default doc: ADMIN + STAFF (MEMORY, NO DISK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(":id/documents/:type/upload")
  @UseInterceptors(FileInterceptor("file")) // ✅ memory storage
  uploadDocument(
    @Param("id") id: string,
    @Param("type") type: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException("Missing file");
    if (!file.buffer) throw new BadRequestException("File buffer not available");

    const userId = (req as any).user?.sub;
    return this.service.attachDocument(Number(id), type, file, userId);
  }

  // ✅ Download default doc from R2 (VIEWER/STAFF/ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get(":id/documents/:type/download")
  async downloadDocument(
    @Param("id") id: string,
    @Param("type") type: string,
    @Res() res: Response,
  ) {
    const doc = await this.service.getDocumentFile(Number(id), type);

    if (!doc?.filePath) throw new NotFoundException("File not found");

    // doc.filePath = R2 key
    const obj = await downloadFromR2(doc.filePath);

    const downloadName = doc.fileName ?? "file";
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);

    // If R2 returns content type, use it; fallback octet-stream
    const contentType =
      (obj as any)?.ContentType ||
      (obj as any)?.contentType ||
      "application/octet-stream";

    res.setHeader("Content-Type", contentType);

    // Stream to response
    const body: any = (obj as any).Body;
    if (!body?.pipe) {
      // in case SDK returns buffer/uint8array
      if (body) return res.send(body);
      throw new NotFoundException("R2 object body empty");
    }
    body.pipe(res);
  }

  // ✅ Update case: ADMIN + STAFF
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      fullName?: string;
      dob?: string;
      jobTitle?: string;
      phone?: string;
      city?: string;
      visaStatus?: string;
      restaurantName?: string;

    },
  ) {
    return this.service.updateCase(Number(id), body);
  }

  // =========================
  // CUSTOM DOCUMENTS
  // =========================

  // ✅ Add custom document row
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(":id/custom-documents")
  addCustomDocument(
    @Param("id") id: string,
    @Body() body: { title: string; required?: boolean },
  ) {
    return this.service.addCustomDocument(Number(id), body);
  }

  // ✅ Delete custom document row
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(":id/custom-documents/:docId")
  deleteCustomDocument(@Param("id") id: string, @Param("docId") docId: string) {
    return this.service.deleteCustomDocument(Number(id), Number(docId));
  }

  // ✅ Upload custom doc file: ADMIN + STAFF (MEMORY)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(":id/custom-documents/:docId/upload")
  @UseInterceptors(FileInterceptor("file")) // ✅ memory storage
  uploadCustomDocument(
    @Param("id") id: string,
    @Param("docId") docId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException("Missing file");
    if (!file.buffer) throw new BadRequestException("File buffer not available");

    const userId = (req as any).user?.sub;
    return this.service.attachCustomDocumentFile(Number(id), Number(docId), file, userId);
  }

  // ✅ Download custom doc file from R2
  @UseGuards(JwtAuthGuard)
  @Get(":id/custom-documents/:docId/download")
  async downloadCustomDocument(
    @Param("id") id: string,
    @Param("docId") docId: string,
    @Res() res: Response,
  ) {
    const doc = await this.service.getCustomDocumentFile(Number(id), Number(docId));
    if (!doc?.filePath) throw new NotFoundException("File not found");

    const obj = await downloadFromR2(doc.filePath);

    const downloadName = doc.fileName ?? "file";
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);

    const contentType =
      (obj as any)?.ContentType ||
      (obj as any)?.contentType ||
      "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    const body: any = (obj as any).Body;
    if (!body?.pipe) {
      if (body) return res.send(body);
      throw new NotFoundException("R2 object body empty");
    }
    body.pipe(res);
  }

  // ✅ Delete case: ADMIN + STAFF
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.deleteCase(Number(id));
  }
}
