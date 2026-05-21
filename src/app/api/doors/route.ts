import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { HEIGHT_CATEGORIES, WIDTH_CATEGORIES } from "@/lib/calculations/sizeCategory";

const MAX_SVG_BYTES = 5 * 1024 * 1024; // 5 МБ
const VALID_VIEW_TYPES = new Set(["system", "top", "door"]);

// GET — список SVG-схем. Фильтры: ?systemSlug=&subsystemName=&viewType=&shotlanType=&heightCategory=&widthCategory=
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const systemSlug = searchParams.get("systemSlug") ?? undefined;
  const subsystemName = searchParams.get("subsystemName") ?? undefined;
  const viewType = searchParams.get("viewType") ?? undefined;
  const shotlanType = searchParams.get("shotlanType") ?? undefined;
  const heightCategory = searchParams.get("heightCategory") ?? undefined;
  const widthCategory = searchParams.get("widthCategory") ?? undefined;

  const where: {
    systemSlug?: string;
    subsystemName?: string;
    viewType?: string;
    shotlanType?: string;
    heightCategory?: string;
    widthCategory?: string;
  } = {};
  if (systemSlug) where.systemSlug = systemSlug;
  if (subsystemName) where.subsystemName = subsystemName;
  if (viewType) where.viewType = viewType;
  if (shotlanType) where.shotlanType = shotlanType;
  if (heightCategory) where.heightCategory = heightCategory;
  if (widthCategory) where.widthCategory = widthCategory;

  const doors = await prisma.doorScheme.findMany({
    where,
    orderBy: [
      { systemSlug: "asc" },
      { subsystemName: "asc" },
      { viewType: "asc" },
      { shotlanType: "asc" },
    ],
  });
  return NextResponse.json(doors);
}

// POST — upsert SVG-схемы по (system, subsystem, viewType, [shotlan], height, width).
export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const systemSlug = String(body.systemSlug || "").trim();
  const subsystemName = String(body.subsystemName || "").trim();
  const viewType = String(body.viewType || "door").trim();
  const shotlanType = body.shotlanType != null ? String(body.shotlanType).trim() : null;
  // Для viewType="top" heightCategory не используется (вид сверху не
  // зависит от высоты проёма) — допускаем null/пустую строку и нормализуем
  // её в null.
  const heightCategoryRaw = body.heightCategory != null ? String(body.heightCategory).trim() : "";
  const heightCategory = viewType === "top" ? "" : heightCategoryRaw;
  const widthCategory = String(body.widthCategory || "").trim();
  const svgContent = String(body.svgContent || "");

  if (!systemSlug || !subsystemName) {
    return NextResponse.json(
      { error: "systemSlug, subsystemName обязательны" },
      { status: 400 },
    );
  }
  if (!VALID_VIEW_TYPES.has(viewType)) {
    return NextResponse.json(
      { error: `viewType должен быть одним из: ${Array.from(VALID_VIEW_TYPES).join(", ")}` },
      { status: 400 },
    );
  }
  // shotlanType обязателен ТОЛЬКО для viewType=door; для system/top — должен быть null/пуст.
  if (viewType === "door" && !shotlanType) {
    return NextResponse.json(
      { error: "shotlanType обязателен для viewType=door" },
      { status: 400 },
    );
  }
  if (viewType !== "top" && !HEIGHT_CATEGORIES.includes(heightCategory as never)) {
    return NextResponse.json(
      { error: `heightCategory должен быть одним из: ${HEIGHT_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!WIDTH_CATEGORIES.includes(widthCategory as never)) {
    return NextResponse.json(
      { error: `widthCategory должен быть одним из: ${WIDTH_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!svgContent || svgContent.length > MAX_SVG_BYTES) {
    return NextResponse.json({ error: "Некорректный или слишком большой SVG" }, { status: 400 });
  }
  const lower = svgContent.toLowerCase();
  if (lower.includes("<!doctype") || lower.includes("<!entity")) {
    return NextResponse.json({ error: "SVG с DOCTYPE/ENTITY недопустим" }, { status: 415 });
  }
  if (/<\s*script/i.test(svgContent)) {
    return NextResponse.json({ error: "SVG со скриптом недопустим" }, { status: 415 });
  }

  // Нормализуем shotlanType для system/top — всегда null, иначе сломаем
  // уникальный индекс (две записи "system" + "null" vs "system" + "" будут
  // считаться разными).
  const normalizedShotlan = viewType === "door" ? shotlanType : null;
  // У вида сверху heightCategory всегда null (высота проёма не влияет).
  const normalizedHeight = viewType === "top" ? null : heightCategory;

  try {
    // upsert через @@unique с nullable shotlanType типизировать неудобно —
    // делаем findFirst + update/create вручную.
    const existing = await prisma.doorScheme.findFirst({
      where: { systemSlug, subsystemName, viewType, shotlanType: normalizedShotlan, heightCategory: normalizedHeight, widthCategory },
    });
    const door = existing
      ? await prisma.doorScheme.update({ where: { id: existing.id }, data: { svgContent } })
      : await prisma.doorScheme.create({
          data: {
            systemSlug,
            subsystemName,
            viewType,
            shotlanType: normalizedShotlan,
            heightCategory: normalizedHeight,
            widthCategory,
            svgContent,
          },
        });
    return NextResponse.json(door, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить SVG-схему" }, { status: 500 });
  }
}

// DELETE — удалить SVG-схему по id.
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
