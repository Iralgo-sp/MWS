-- InsurancePolicy: add year, status, isSelected, default policyNumber
ALTER TABLE "InsurancePolicy" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "InsurancePolicy" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'presupuesto';
ALTER TABLE "InsurancePolicy" ADD COLUMN "isSelected" BOOLEAN NOT NULL DEFAULT false;

-- Backfill year from startDate (Prisma stores DateTime as ms timestamp in SQLite)
UPDATE "InsurancePolicy" SET "year" = CAST(strftime('%Y', "startDate"/1000, 'unixepoch') AS INTEGER);

-- Installment: add concept
ALTER TABLE "Installment" ADD COLUMN "concept" TEXT NOT NULL DEFAULT 'cuota';
