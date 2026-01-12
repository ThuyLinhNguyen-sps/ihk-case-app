/*
  Warnings:

  - You are about to drop the column `uploadedAt` on the `CaseDocument` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('HOAN_TAT', 'VAN_THIEU_HO_SO', 'DA_LAN_TAY', 'DA_CO_VISUM', 'CHUA_DU_8_THANG');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "city" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "visaStatus" "VisaStatus" DEFAULT 'VAN_THIEU_HO_SO';

-- AlterTable
ALTER TABLE "CaseDocument" DROP COLUMN "uploadedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
