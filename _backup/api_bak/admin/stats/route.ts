import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    calculationsToday,
    activePartners,
    totalCalculations,
    totalRevenue,
    recentCalculations,
  ] = await Promise.all([
    prisma.calculation.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: "PARTNER", status: "ACTIVE" } }),
    prisma.calculation.count(),
    prisma.calculation.aggregate({ _sum: { totalPrice: true } }),
    prisma.calculation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        system: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    calculationsToday,
    activePartners,
    totalCalculations,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    recentCalculations,
  });
}
