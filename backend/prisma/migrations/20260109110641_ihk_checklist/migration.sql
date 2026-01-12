-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('APPLICATION_FORM', 'DIPLOMA_AND_SUBJECTS', 'PROOF_WORK_EXPERIENCE', 'OTHER_QUALIFICATIONS', 'IDENTITY_PROOF', 'CV', 'INTENT_TO_WORK_PROOF', 'TRAINING_CURRICULUM');

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "type" "DocType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "fileName" TEXT,
    "filePath" TEXT,
    "language" TEXT,
    "translationRequired" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3),
    "uploadedBy" INTEGER,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseDocument_caseId_type_key" ON "CaseDocument"("caseId", "type");

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
