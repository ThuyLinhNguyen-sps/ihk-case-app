import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisaProfileService {
  constructor(private prisma: PrismaService) {}

  // ✅ Tạm thời disable VisaProfile vì DB production chưa có bảng VisaProfile
  // Trả về null để frontend vẫn render được (không crash backend).
  async getByCaseId(caseId: number) {
    // vẫn check Case tồn tại để route không bị dùng sai id
    await this.prisma.case.findUniqueOrThrow({ where: { id: caseId } });
    return null;
  }

  // ✅ Disable upsert để tránh gọi prisma.visaProfile.upsert (bảng chưa tồn tại)
  async upsert(caseId: number, data: any) {
    await this.prisma.case.findUniqueOrThrow({ where: { id: caseId } });

    // Tạm thời không lưu. Trả về data giả lập để frontend không bị lỗi.
    // Bạn có thể return null nếu muốn.
    return {
      caseId,
      ...data,
      _disabled: true,
      _reason: 'VisaProfile feature is disabled because VisaProfile table is missing in production DB.',
    };
  }
}
