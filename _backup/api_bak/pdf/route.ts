import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { calculationId } = body;

    if (!calculationId) {
      return NextResponse.json(
        { error: "calculationId required" },
        { status: 400 }
      );
    }

    const calculation = await prisma.calculation.findUnique({
      where: { id: calculationId },
      include: {
        system: true,
        subsystem: true,
      },
    });

    if (!calculation) {
      return NextResponse.json(
        { error: "Calculation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(calculation);
  } catch (error) {
    console.error("PDF API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
