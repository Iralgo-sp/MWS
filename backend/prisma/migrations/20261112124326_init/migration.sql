-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InsurancePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'presupuesto',
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "company" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "annualCost" REAL,
    "hasFranchise" BOOLEAN NOT NULL DEFAULT false,
    "franchiseAmount" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InsurancePolicy_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InsurancePolicy" ("annualCost", "company", "createdAt", "endDate", "franchiseAmount", "hasFranchise", "id", "isSelected", "notes", "policyNumber", "startDate", "status", "type", "vehicleId", "year") SELECT "annualCost", "company", "createdAt", "endDate", "franchiseAmount", "hasFranchise", "id", "isSelected", "notes", "policyNumber", "startDate", "status", "type", "vehicleId", "year" FROM "InsurancePolicy";
DROP TABLE "InsurancePolicy";
ALTER TABLE "new_InsurancePolicy" RENAME TO "InsurancePolicy";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
