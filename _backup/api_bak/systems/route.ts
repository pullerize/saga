import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const systems = await prisma.doorSystem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      subsystems: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  return NextResponse.json(systems);
}
