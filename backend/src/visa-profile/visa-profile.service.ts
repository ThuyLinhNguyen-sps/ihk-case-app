import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VisaProfileService {
  constructor(private prisma: PrismaService) {}

  async getByCaseId(caseId: number) {
    return this.prisma.visaProfile.findUnique({
      where: { caseId },
    });
  }

  async upsert(caseId: number, raw: any) {
    await this.prisma.case.findUniqueOrThrow({
      where: { id: caseId },
    });

    // ✅ SANITIZE DATA (QUAN TRỌNG)
    const data = this.clean(raw);

    return this.prisma.visaProfile.upsert({
      where: { caseId },
      create: { caseId, ...data },
      update: data,
    });
  }

  private clean(input: any) {
    const toNull = (v: any) =>
      v === "" || v === undefined ? null : v;

    const toInt = (v: any) =>
      v === "" || v === undefined ? null : Number(v);

    const toDate = (v: any) =>
      v ? new Date(v) : null;

    const toJson = (v: any) =>
      Array.isArray(v) && v.length === 0 ? null : v;

    return {
      phone: toNull(input.phone),
      email: toNull(input.email),
      homeAddress: toNull(input.homeAddress),
      heightCm: toInt(input.heightCm),
      eyeColor: toNull(input.eyeColor),
      religion: toNull(input.religion),
      maritalStatus: input.maritalStatus || "DOC_THAN",
      marriageDate: toDate(input.marriageDate),
      divorceDate: toDate(input.divorceDate),
      currentCompany: toNull(input.currentCompany),
      companyAddress: toNull(input.companyAddress),
      graduatedSchool: toNull(input.graduatedSchool),
      major: toNull(input.major),
      bigAssets: toNull(input.bigAssets),

      familyMembers: toJson(input.familyMembers),
      familyJobsIncome: toJson(input.familyJobsIncome),
      travelHistory: toJson(input.travelHistory),
      educationHistory: toJson(input.educationHistory),
      workHistory: toJson(input.workHistory),
    };
  }
}
