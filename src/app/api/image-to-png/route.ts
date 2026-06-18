import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAuth } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";
import fs from "fs/promises";
import path from "path";

const MAX_BYTES = 10 * 1024 * 1024; // 10 МБ потолок для входной картинки
const MAX_SIDE = 1600;              // потолок стороны PNG-вывода

/**
 * Конвертация произвольной картинки → PNG data-URL для встраивания в PDF.
 * Нужен, потому что @react-pdf/renderer не умеет рендерить .webp/.svg/.gif
 * через <Image> — но JPEG/PNG умеет. Принимаем URL (как локальный
 * `/uploads/...`, так и абсолютный), читаем файл и отдаём PNG dataUrl.
 */
export async function POST(req: Request) {
  const limited = rateLimit("img2png", req, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const { error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "url обязателен" }, { status: 400 });

  let buf: Buffer;
  try {
    if (url.startsWith("/uploads/")) {
      // Локальный файл из public/uploads — читаем напрямую с диска.
      const safe = url.replace(/\.\.+/g, "");
      const fp = path.join(process.cwd(), "public", safe.replace(/^\//, ""));
      buf = await fs.readFile(fp);
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      const r = await fetch(url);
      if (!r.ok) return NextResponse.json({ error: `HTTP ${r.status}` }, { status: 502 });
      const ab = await r.arrayBuffer();
      buf = Buffer.from(ab);
    } else {
      return NextResponse.json({ error: "Поддерживаются /uploads/ и http(s):// URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Не удалось получить файл" }, { status: 404 });
  }
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой" }, { status: 413 });
  }

  try {
    const out = await sharp(buf)
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
    const meta = await sharp(out).metadata();
    const base64 = out.toString("base64");
    return NextResponse.json({
      dataUrl: `data:image/png;base64,${base64}`,
      width: meta.width || 0,
      height: meta.height || 0,
    });
  } catch (e) {
    console.error("image-to-png error:", e);
    return NextResponse.json({ error: "Не удалось сконвертировать" }, { status: 500 });
  }
}
