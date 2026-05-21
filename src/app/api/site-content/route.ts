import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

const VALID_TYPES = new Set(["text", "image", "video"]);

// GET — публичный. Возвращает все записи site-content или одну по ?key=
// Используется на самом landing — оба гостя и админ видят актуальный контент.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key) {
    const item = await prisma.siteContent.findUnique({ where: { key } });
    return NextResponse.json(item);
  }
  const all = await prisma.siteContent.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json(all);
}

// PUT — только ADMIN. Upsert значения по ключу.
// Body: { key: string, type?: "text"|"image"|"video", value: string }
export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const key = String(body.key || "").trim();
  const type = String(body.type || "text").trim();
  const value = typeof body.value === "string" ? body.value : "";

  if (!key) return NextResponse.json({ error: "key обязателен" }, { status: 400 });
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: `type должен быть одним из: ${Array.from(VALID_TYPES).join(", ")}` },
      { status: 400 },
    );
  }
  if (value.length > 50_000) {
    return NextResponse.json({ error: "value слишком большой" }, { status: 413 });
  }

  try {
    const item = await prisma.siteContent.upsert({
      where: { key },
      create: { key, type, value },
      update: { type, value },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}
