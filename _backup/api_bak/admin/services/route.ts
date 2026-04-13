import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const services = await prisma.additionalService.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { name, description, defaultPrice, priceUnit, showInPdf } = body;

  const service = await prisma.additionalService.create({
    data: { name, description, defaultPrice, priceUnit, showInPdf },
  });

  return NextResponse.json(service, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;

  const service = await prisma.additionalService.update({
    where: { id },
    data,
  });

  return NextResponse.json(service);
}
