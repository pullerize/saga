import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const glassTypes = await prisma.glassType.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(glassTypes);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { updates } = body as { updates: { id: string; defaultPrice: number }[] };

  await prisma.$transaction(
    updates.map((u) =>
      prisma.glassType.update({
        where: { id: u.id },
        data: { defaultPrice: u.defaultPrice },
      })
    )
  );

  return NextResponse.json({ success: true });
}
