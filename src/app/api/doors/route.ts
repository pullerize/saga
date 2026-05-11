import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

const MAX_SVG_BYTES = 5 * 1024 * 1024; // 5 МБ

// GET — список всех дверей. С опциональными фильтрами ?systemSlug=&subsystemName=
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const systemSlug = searchParams.get("systemSlug") ?? undefined;
  const subsystemName = searchParams.get("subsystemName") ?? undefined;
  const shotlanType = searchParams.get("shotlanType") ?? undefined;

  const where: { systemSlug?: string; subsystemName?: string; shotlanType?: string } = {};
  if (systemSlug) where.systemSlug = systemSlug;
  if (subsystemName) where.subsystemName = subsystemName;
  if (shotlanType) where.shotlanType = shotlanType;

  const doors = await prisma.doorScheme.findMany({
    where,
    orderBy: [{ systemSlug: "asc" }, { subsystemName: "asc" }, { shotlanType: "asc" }],
  });
  return NextResponse.json(doors);
}

// POST — upsert (создать или заменить) дверь по (system, subsystem, shotlan).
export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const systemSlug = String(body.systemSlug || "").trim();
  const subsystemName = String(body.subsystemName || "").trim();
  const shotlanType = String(body.shotlanType || "").trim();
  const svgContent = String(body.svgContent || "");

  if (!systemSlug || !subsystemName || !shotlanType) {
    return NextResponse.json(
      { error: "systemSlug, subsystemName, shotlanType обязательны" },
      { status: 400 },
    );
  }
  if (!svgContent || svgContent.length > MAX_SVG_BYTES) {
    return NextResponse.json({ error: "Некорректный или слишком большой SVG" }, { status: 400 });
  }
  // Базовая защита от XXE/скриптов в SVG (как в /api/svg-to-png).
  const lower = svgContent.toLowerCase();
  if (lower.includes("<!doctype") || lower.includes("<!entity")) {
    return NextResponse.json({ error: "SVG с DOCTYPE/ENTITY недопустим" }, { status: 415 });
  }
  if (/<\s*script/i.test(svgContent)) {
    return NextResponse.json({ error: "SVG со скриптом недопустим" }, { status: 415 });
  }

  try {
    const door = await prisma.doorScheme.upsert({
      where: {
        systemSlug_subsystemName_shotlanType: { systemSlug, subsystemName, shotlanType },
      },
      create: { systemSlug, subsystemName, shotlanType, svgContent },
      update: { svgContent },
    });
    return NextResponse.json(door, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить дверь" }, { status: 500 });
  }
}

// DELETE — удалить дверь по id.
export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.doorScheme.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
