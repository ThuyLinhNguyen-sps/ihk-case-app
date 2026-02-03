-- Add VisaProfile table (safe migration for existing database)

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "VisaProfile" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "homeAddress" TEXT,
    "heightCm" INTEGER,
    "eyeColor" TEXT,
    "religion" TEXT,
    "maritalStatus" TEXT,
    "marriageDate" TIMESTAMP(3),
    "divorceDate" TIMESTAMP(3),
    "currentCompany" TEXT,
    "companyAddress" TEXT,
    "graduatedSchool" TEXT,
    "major" TEXT,
    "bigAssets" TEXT,
    "familyMembers" JSONB,
    "familyJobsIncome" JSONB,
    "travelHistory" JSONB,
    "educationHistory" JSONB,
    "workHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique caseId)
CREATE UNIQUE INDEX IF NOT EXISTS "VisaProfile_caseId_key" ON "VisaProfile"("caseId");

-- AddForeignKey (caseId -> Case.id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'VisaProfile_caseId_fkey'
  ) THEN
    ALTER TABLE "VisaProfile"
    ADD CONSTRAINT "VisaProfile_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "Case"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
