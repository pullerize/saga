import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 8 * 1024 * 1024; // 8 МБ

// Магические байты — проверяем РЕАЛЬНЫЙ тип файла, а не Content-Type, который
// клиент может подделать. Расширение тоже определяем здесь, не доверяя имени.
const MAGIC_SIGNATURES: Array<{ ext: string; check: (b: Buffer) => boolean }> = [
  {
    ext: "png",
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    ext: "jpg",
    check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "gif",
    check: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61,
  },
  {
    ext: "webp",
    check: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    // SVG — текст. Принимаем "<?xml" или "<svg" в первых 256 байтах.
    ext: "svg",
    check: (b) => {
      const s = b.slice(0, 256).toString("utf-8").replace(/^﻿/, "").trimStart().toLowerCase();
      return s.startsWith("<?xml") || s.startsWith("<svg");
    },
  },
];

/**
 * Защищённая загрузка файлов:
 *   • Только залогиненные пользователи.
 *   • Лимит 8 МБ.
 *   • Тип определяется по магическим байтам (не по Content-Type клиента).
 *   • Имя файла и расширение — генерируются на сервере (нет path traversal).
 *   • SVG с <!DOCTYPE>/<!ENTITY>/<script> отвергаются.
 */
export async function POST(req: Request) {
  const limited = rateLimit("upload", req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  const { error } = await requireAuth();
  if (error) return error;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Невалидный multipart" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Пустой файл" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Файл слишком большой (макс. ${Math.round(MAX_BYTES / 1024 / 1024)} МБ)` },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sig = MAGIC_SIGNATURES.find((s) => s.check(bytes));
  if (!sig) {
    return NextResponse.json(
      { error: "Допустимые форматы: PNG, JPG, WebP, SVG, GIF" },
      { status: 415 },
    );
  }

  if (sig.ext === "svg") {
    const text = bytes.toString("utf-8").toLowerCase();
    if (text.includes("<!doctype") || text.includes("<!entity")) {
      return NextResponse.json({ error: "SVG с DOCTYPE/ENTITY недопустим" }, { status: 415 });
    }
    if (/<\s*script/i.test(text)) {
      return NextResponse.json({ error: "SVG со скриптом недопустим" }, { status: 415 });
    }
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${sig.ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), bytes);
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить файл" }, { status: 500 });
  }
  return NextResponse.json({ url: `/uploads/${name}`, name });
}
