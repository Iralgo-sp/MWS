-- Add proactive reminder fields to Vehicle
ALTER TABLE "Vehicle" ADD COLUMN "nextItv" DATETIME;
ALTER TABLE "Vehicle" ADD COLUMN "serviceIntervalKm" INTEGER;
