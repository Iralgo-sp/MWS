import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get("/api/dashboard/summary", async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 días

    // ── Próximos vencimientos de seguros ──────────────────────────────────
    const expiringPolicies = await prisma.insurancePolicy.findMany({
      where: {
        isSelected: true,
        endDate: { gte: now, lte: horizon },
        vehicle: { status: "activo" },
      },
      orderBy: { endDate: "asc" },
      include: { vehicle: { select: { id: true, alias: true, type: true } } },
    });

    // ── Próximas ITV ──────────────────────────────────────────────────────
    const upcomingItv = await prisma.vehicle.findMany({
      where: {
        status: "activo",
        nextItv: { gte: now, lte: horizon },
      },
      orderBy: { nextItv: "asc" },
      select: { id: true, alias: true, type: true, nextItv: true },
    });

    // ── Alertas por kilometraje ───────────────────────────────────────────
    const vehiclesWithInterval = await prisma.vehicle.findMany({
      where: { status: "activo", serviceIntervalKm: { not: null } },
      select: {
        id: true, alias: true, type: true, serviceIntervalKm: true,
        odometerReadings: { orderBy: { mileage: "desc" }, take: 1 },
        maintenanceRecords: {
          where: { type: "revision", mileage: { not: null } },
          orderBy: { date: "desc" },
          take: 1,
          select: { mileage: true },
        },
      },
    });

    const kmAlerts = vehiclesWithInterval
      .map((v) => {
        const currentKm = v.odometerReadings[0]?.mileage ?? 0;
        const lastRevisionKm = v.maintenanceRecords[0]?.mileage ?? 0;
        const kmSince = currentKm - lastRevisionKm;
        return { ...v, currentKm, lastRevisionKm, kmSince };
      })
      .filter((v) => v.serviceIntervalKm != null && v.kmSince >= v.serviceIntervalKm)
      .map(({ id, alias, type, serviceIntervalKm, currentKm, lastRevisionKm, kmSince }) => ({
        id, alias, type, currentKm, lastRevisionKm,
        serviceIntervalKm: serviceIntervalKm!,
        kmOverdue: kmSince - serviceIntervalKm!,
      }));

    // ── Cuotas pendientes de pago este mes ────────────────────────────────
    const pendingThisMonth = await prisma.installment.findMany({
      where: {
        isPaid: false,
        paymentDate: { gte: monthStart, lte: monthEnd },
        vehicle: { status: "activo" },
      },
      orderBy: { paymentDate: "asc" },
      include: { vehicle: { select: { id: true, alias: true, type: true } } },
    });

    // ── Gastos del mes en curso ────────────────────────────────────────────
    const [maintenanceCosts, insuranceCosts, installmentCosts] = await Promise.all([
      prisma.maintenanceRecord.aggregate({
        _sum: { cost: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.insurancePolicy.aggregate({
        _sum: { annualCost: true },
        where: { startDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.installment.aggregate({
        _sum: { totalAmount: true },
        where: { isPaid: true, paymentDate: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    const maintenance = maintenanceCosts._sum.cost ?? 0;
    const insurance = insuranceCosts._sum.annualCost ?? 0;
    const installments = installmentCosts._sum.totalAmount ?? 0;

    return {
      expiringPolicies,
      upcomingItv,
      kmAlerts,
      pendingThisMonth,
      monthlyExpenses: {
        maintenance,
        insurance,
        installments,
        total: maintenance + insurance + installments,
      },
    };
  });
}
