-- CreateTable
CREATE TABLE "AcquisitionOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "sellerType" TEXT NOT NULL DEFAULT 'concesionario',
    "sellerName" TEXT NOT NULL,
    "sellerPhone" TEXT,
    "sellerAddress" TEXT,
    "offerDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'en_estudio',
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "listPrice" REAL,
    "negotiatedPrice" REAL,
    "tradeInValue" REAL,
    "taxesFees" REAL,
    "warrantyMonths" INTEGER,
    "includedExtras" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcquisitionOffer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "maintenanceRecordId" TEXT,
    "insurancePolicyId" TEXT,
    "acquisitionOfferId" TEXT,
    "label" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_insurancePolicyId_fkey" FOREIGN KEY ("insurancePolicyId") REFERENCES "InsurancePolicy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_acquisitionOfferId_fkey" FOREIGN KEY ("acquisitionOfferId") REFERENCES "AcquisitionOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("id", "insurancePolicyId", "label", "maintenanceRecordId", "mimeType", "originalName", "size", "storedFilename", "uploadedAt", "vehicleId") SELECT "id", "insurancePolicyId", "label", "maintenanceRecordId", "mimeType", "originalName", "size", "storedFilename", "uploadedAt", "vehicleId" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
