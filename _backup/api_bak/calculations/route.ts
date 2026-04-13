import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const role = session!.user.role;

  const where = role === "ADMIN" ? {} : { userId };

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const [calculations, total] = await Promise.all([
    prisma.calculation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        system: { select: { name: true, slug: true } },
        subsystem: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.calculation.count({ where }),
  ]);

  return NextResponse.json({ calculations, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      customerName,
      customerPhone,
      systemId,
      subsystemId,
      fullWidth,
      openWidth,
      height,
      doorWidth,
      glassType,
      shotlanType,
      components,
      totalPrice,
      services,
    } = body;

    if (!customerName || !systemId || !subsystemId) {
      return NextResponse.json(
        { error: "Обязательные поля не заполнены" },
        { status: 400 }
      );
    }

    const calculation = await prisma.calculation.create({
      data: {
        userId: userId || null,
        customerName,
        customerPhone: customerPhone || "",
        systemId,
        subsystemId,
        fullWidth,
        openWidth: openWidth || null,
        height,
        doorWidth,
        glassType,
        shotlanType,
        components,
        totalPrice,
        services: services || null,
        status: "draft",
      },
    });

    return NextResponse.json(calculation, { status: 201 });
  } catch (error) {
    console.error("Calculation save error:", error);
    return NextResponse.json(
      { error: "Ошибка при сохранении расчёта" },
      { status: 500 }
    );
  }
}
