import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { resolveCompanyName } from "@/lib/company";
import type { UserRole } from "@/types";

function isAdminLike(role: UserRole | string | undefined) {
  return role === "ADMIN";
}

async function resolveActorCompany(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyName: true },
  });
  if (!user) return null;
  return {
    role: user.role as UserRole,
    companyName: resolveCompanyName(user.role as UserRole, user.companyName),
  };
}

// GET — list cards (admin: all; partner/colleague: own company only)
export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;
  const role = session!.user.role;

  if (isAdminLike(role)) {
    const cards = await prisma.clientCard.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cards);
  }

  const actor = await resolveActorCompany(session!.user.id);
  if (!actor) {
    return NextResponse.json([], { status: 200 });
  }

  const cards = await prisma.clientCard.findMany({
    where: { companyName: actor.companyName },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cards);
}

// POST — create a card, stamping company from actor
export async function POST(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const actor = await resolveActorCompany(session!.user.id);
  if (!actor) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

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
      createdByUserId: session!.user.id,
      companyName: actor.companyName,
    },
  });
  return NextResponse.json(card, { status: 201 });
}

// PUT — update existing card
export async function PUT(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.clientCard.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  const role = session!.user.role;
  if (!isAdminLike(role)) {
    const actor = await resolveActorCompany(session!.user.id);
    if (!actor || existing.companyName !== actor.companyName) {
      return NextResponse.json({ error: "Нет доступа к карточке" }, { status: 403 });
    }
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

// DELETE — delete a card
export async function DELETE(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.clientCard.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  const role = session!.user.role;
  if (!isAdminLike(role)) {
    const actor = await resolveActorCompany(session!.user.id);
    if (!actor || existing.companyName !== actor.companyName) {
      return NextResponse.json({ error: "Нет доступа к карточке" }, { status: 403 });
    }
  }

  await prisma.clientCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
