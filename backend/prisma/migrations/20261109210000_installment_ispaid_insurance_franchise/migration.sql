ALTER TABLE "Installment" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Installment" ADD COLUMN "remainingBalance" REAL;
ALTER TABLE "InsurancePolicy" ADD COLUMN "hasFranchise" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InsurancePolicy" ADD COLUMN "franchiseAmount" REAL;
