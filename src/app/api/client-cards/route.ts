import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — list all cards (newest first)
export async function GET() {
  const cards = await prisma.clientCard.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cards);
}

// POST — create a new card
export async function POST(req: Request) {
  const body = await req.json();
  const card = await prisma.clientCard.create({
    data: {
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      clientAddress: body.clientAddress ?? "",
      managerName: body.managerName,
      branch: body.branch,
      systemSlug: body.systemSlug ?? null,
      systemName: body.systemName,
      subsystem: body.subsystem,
      glass: body.glass,
      shotlan: body.shotlan,
      fullWidth: body.fullWidth,
      openWidth: body.openWidth ?? 0,
      height: body.height,
      doorWidth: body.doorWidth,
      totalPrice: body.totalPrice,
      components: body.components,
    },
  });
  return NextResponse.json(card, { status: 201 });
}

// PUT — update an existing card
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const card = await prisma.clientCard.update({
    where: { id },
    data: {
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientAddress: data.clientAddress ?? "",
      managerName: data.managerName,
      branch: data.branch,
      systemSlug: data.systemSlug ?? null,
      systemName: data.systemName,
      subsystem: data.subsystem,
      glass: data.glass,
      shotlan: data.shotlan,
      fullWidth: data.fullWidth,
      openWidth: data.openWidth ?? 0,
      height: data.height,
      doorWidth: data.doorWidth,
      totalPrice: data.totalPrice,
      components: data.components,
    },
  });
  return NextResponse.json(card);
}

// DELETE — delete a card by id (passed as query param)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await prisma.clientCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
