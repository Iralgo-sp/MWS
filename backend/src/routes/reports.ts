import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default async function reportRoutes(app: FastifyInstance) {
  app.get("/api/reports/fleet", async () => {
    const now = new Date();

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        maintenanceRecords: { select: { cost: true } },
        insurancePolicies: { where: { isSelected: true }, select: { annualCost: true } },
        installments: { where: { isPaid: true }, select: { interestAmount: true } },
        odometerReadings: { orderBy: { date: "asc" }, select: { mileage: true } },
      },
    });

    const vehicleReports = vehicles.map((v) => {
      const purchasePrice = v.purchasePrice ?? 0;
      const totalMaintenance = v.maintenanceRecords.reduce((s, r) => s + (r.cost ?? 0), 0);
      const totalInsurance = v.insurancePolicies.reduce((s, p) => s + (p.annualCost ?? 0), 0);
      const totalInterest = v.installments.reduce((s, i) => s + (i.interestAmount ?? 0), 0);
      const tcoTotal = purchasePrice + totalMaintenance + totalInsurance + totalInterest;

      const ageYears = v.purchaseDate
        ? (now.getTime() - v.purchaseDate.getTime()) / (MS_PER_DAY * 365.25)
        : v.year
        ? now.getFullYear() - v.year
        : null;

      const monthsOwned = v.purchaseDate
        ? Math.max(1, Math.round((now.getTime() - v.purchaseDate.getTime()) / (MS_PER_DAY * 30.44)))
        : null;
      const eurPerMonth = monthsOwned ? tcoTotal / monthsOwned : null;

      const readings = v.odometerReadings;
      const currentKm = readings.length > 0 ? readings[readings.length - 1].mileage : null;
      const totalKm =
        readings.length >= 2
          ? readings[readings.length - 1].mileage - readings[0].mileage
          : readings.length === 1
          ? readings[0].mileage
          : null;
      const eurPerKm = totalKm && totalKm > 0 ? tcoTotal / totalKm : null;

      return {
        id: v.id,
        alias: v.alias,
        type: v.type,
        brand: v.brand,
        model: v.model,
        year: v.year,
        status: v.status,
        purchaseDate: v.purchaseDate,
        purchasePrice,
        ageYears,
        currentKm,
        totalMaintenance,
        totalInsurance,
        totalInterest,
        tcoTotal,
        eurPerMonth,
        eurPerKm,
      };
    });

    const activeReports = vehicleReports.filter((v) => v.status === "activo");

    const byType = Array.from(new Set(vehicles.map((v) => v.type))).map((type) => {
      const items = vehicleReports.filter((v) => v.type === type);
      return {
        type,
        count: items.length,
        tcoTotal: items.reduce((s, v) => s + v.tcoTotal, 0),
      };
    });

    const agesKnown = activeReports.map((v) => v.ageYears).filter((a): a is number => a != null);
    const averageAgeYears = agesKnown.length > 0 ? agesKnown.reduce((s, a) => s + a, 0) / agesKnown.length : null;

    const summary = {
      totalVehicles: vehicleReports.length,
      activeVehicles: activeReports.length,
      soldVehicles: vehicleReports.length - activeReports.length,
      averageAgeYears,
      totalPurchaseValue: vehicleReports.reduce((s, v) => s + v.purchasePrice, 0),
      totalMaintenanceCost: vehicleReports.reduce((s, v) => s + v.totalMaintenance, 0),
      totalInsuranceCost: vehicleReports.reduce((s, v) => s + v.totalInsurance, 0),
      totalInterestCost: vehicleReports.reduce((s, v) => s + v.totalInterest, 0),
      totalTco: vehicleReports.reduce((s, v) => s + v.tcoTotal, 0),
    };

    return {
      generatedAt: now.toISOString(),
      summary,
      byType,
      vehicles: vehicleReports,
    };
  });
}
