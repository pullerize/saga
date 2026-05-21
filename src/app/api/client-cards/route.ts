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

  const body = await req.json().catch(() => ({}));
  // Базовые проверки обязательных полей и диапазонов
  if (!body?.clientName || typeof body.clientName !== "string") {
    return NextResponse.json({ error: "clientName обязателен" }, { status: 400 });
  }
  if (!body?.systemName || typeof body.systemName !== "string") {
    return NextResponse.json({ error: "systemName обязателен" }, { status: 400 });
  }
  for (const k of ["fullWidth", "height", "doorWidth", "totalPrice"] as const) {
    if (!Number.isFinite(body[k]) || body[k] < 0 || body[k] > 1_000_000) {
      return NextResponse.json({ error: `Некорректное значение ${k}` }, { status: 400 });
    }
  }
  if (!Array.isArray(body.components)) {
    return NextResponse.json({ error: "components должен быть массивом" }, { status: 400 });
  }

  try {
    const card = await prisma.clientCard.create({
      data: {
        clientName: String(body.clientName),
        clientPhone: String(body.clientPhone ?? ""),
        clientAddress: String(body.clientAddress ?? ""),
        managerName: String(body.managerName ?? ""),
        managerPhone: body.managerPhone ?? null,
        branch: String(body.branch ?? ""),
        referralSource: String(body.referralSource ?? ""),
        referralDetail: String(body.referralDetail ?? ""),
        systemSlug: body.systemSlug ?? null,
        systemName: String(body.systemName),
        subsystem: String(body.subsystem ?? ""),
        glass: String(body.glass ?? ""),
        shotlan: String(body.shotlan ?? ""),
        fullWidth: body.fullWidth,
        openWidth: Number.isFinite(body.openWidth) ? body.openWidth : 0,
        height: body.height,
        doorWidth: body.doorWidth,
        totalPrice: body.totalPrice,
        components: body.components,
        customServices: body.customServices ?? null,
        createdByUserId: session!.user.id,
        companyName: actor.companyName,
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать карточку" }, { status: 500 });
  }
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
    // Не-админ может редактировать карточку, если он:
    //   1) сам её создал (надёжная проверка по createdByUserId), ИЛИ
    //   2) состоит в той же компании (по имени, для совместимости).
    const me = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { companyName: true },
    });
    const isOwner = existing.createdByUserId === session!.user.id;
    const isSameCompany = !!me?.companyName && existing.companyName === me.companyName;
    if (!isOwner && !isSameCompany) {
      return NextResponse.json({ error: "Нет доступа к карточке" }, { status: 403 });
    }
  }

  try {
    const card = await prisma.clientCard.update({
      where: { id },
      data: {
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientAddress: data.clientAddress ?? "",
        managerName: data.managerName,
        managerPhone: data.managerPhone ?? null,
        branch: data.branch,
        ...(data.referralSource !== undefined ? { referralSource: String(data.referralSource ?? "") } : {}),
        ...(data.referralDetail !== undefined ? { referralDetail: String(data.referralDetail ?? "") } : {}),
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
        customServices: data.customServices ?? null,
      },
    });
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить карточку" }, { status: 500 });
  }
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
    const me = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { companyName: true },
    });
    const isOwner = existing.createdByUserId === session!.user.id;
    const isSameCompany = !!me?.companyName && existing.companyName === me.companyName;
    if (!isOwner && !isSameCompany) {
      return NextResponse.json({ error: "Нет доступа к карточке" }, { status: 403 });
    }
  }

  await prisma.clientCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
