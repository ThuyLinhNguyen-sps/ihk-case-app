import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisaProfileService {
  constructor(private prisma: PrismaService) {}

  async getByCaseId(caseId: number) {
    await this.prisma.case.findUniqueOrThrow({ where: { id: caseId } });
    return this.prisma.visaProfile.findUnique({
      where: { caseId },
    });
  }

  async upsert(caseId: number, data: any) {
    await this.prisma.case.findUniqueOrThrow({ where: { id: caseId } });

    return this.prisma.visaProfile.upsert({
      where: { caseId },
      create: { caseId, ...data },
      update: { ...data },
    });
  }
}

