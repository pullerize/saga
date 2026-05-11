import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAuth } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";

const MAX_SVG_BYTES = 5 * 1024 * 1024; // 5 МБ — потолок размера SVG-строки
const MAX_SIDE = 1600;                  // максимальная сторона PNG-вывода

/**
 * Конвертация SVG → PNG (для встраивания в PDF).
 *   • Только залогиненные.
 *   • Лимит размера 5 МБ.
 *   • SVG без <!DOCTYPE>/<!ENTITY>/<script> (защита от XXE и активного кода).
 *   • Размер выходного PNG ограничен 1600px по большей стороне.
 *   • Детали внутренних ошибок наружу не утекают.
 */
export async function POST(req: Request) {
  const limited = rateLimit("svg2png", req, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const { error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.svgContent !== "string") {
    return NextResponse.json({ error: "svgContent обязателен" }, { status: 400 });
  }
  let svg: string = body.svgContent;
  if (svg.length === 0) {
    return NextResponse.json({ error: "Пустой SVG" }, { status: 400 });
  }
  if (svg.length > MAX_SVG_BYTES) {
    return NextResponse.json({ error: "SVG слишком большой" }, { status: 413 });
  }

  // Защита от XXE / активных скриптов
  const lower = svg.toLowerCase();
  if (lower.includes("<!doctype") || lower.includes("<!entity")) {
    return NextResponse.json({ error: "SVG с DOCTYPE/ENTITY недопустим" }, { status: 415 });
  }
  if (/<\s*script/i.test(svg)) {
    return NextResponse.json({ error: "SVG со скриптом недопустим" }, { status: 415 });
  }
  // Удаляем потенциальные обработчики событий
  svg = svg.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
           .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");

  if (!svg.includes("xmlns=")) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  function readSvgSize(s: string): { w: number; h: number } {
    // viewBox в приоритете: реальные пропорции содержимого SVG задаются им,
    // а не атрибутами width/height (последние могут быть в %, в мм или вообще
    // отличаться от viewBox-аспекта, что приводит к letterbox внутри PNG).
    const vb = s.match(/viewBox\s*=\s*["']([^"']+)["']/i);
    if (vb) {
      const parts = vb[1].split(/[\s,]+/).map(Number);
      if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
        return { w: parts[2], h: parts[3] };
      }
    }
    const wMatch = s.match(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i);
    const hMatch = s.match(/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i);
    if (wMatch && hMatch) return { w: parseFloat(wMatch[1]), h: parseFloat(hMatch[1]) };
    return { w: 1000, h: 1000 };
  }

  const { w: svgW, h: svgH } = readSvgSize(svg);
  if (!Number.isFinite(svgW) || !Number.isFinite(svgH) || svgW <= 0 || svgH <= 0) {
    return NextResponse.json({ error: "Некорректный размер SVG" }, { status: 400 });
  }
  const scale = Math.min(MAX_SIDE / svgW, MAX_SIDE / svgH, 1);
  const outW = Math.max(1, Math.round(svgW * scale));
  const outH = Math.max(1, Math.round(svgH * scale));

  svg = svg.replace(/(<svg[^>]*\s)width\s*=\s*["'][^"']*["']/i, `$1width="${outW}"`);
  svg = svg.replace(/(<svg[^>]*\s)height\s*=\s*["'][^"']*["']/i, `$1height="${outH}"`);

  try {
    const pngBuffer = await sharp(Buffer.from(svg, "utf-8"), {
      density: 72,
      // unlimited:false — не даём sharp выходить за свои безопасные пределы
    })
      .resize(outW, outH, { fit: "inside", withoutEnlargement: false })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();

    const meta = await sharp(pngBuffer).metadata();
    const base64 = pngBuffer.toString("base64");

    return NextResponse.json({
      dataUrl: `data:image/png;base64,${base64}`,
      width: meta.width || 0,
      height: meta.height || 0,
    });
  } catch (err) {
    // Детали ошибки логируем только на сервере, наружу не отдаём.
    console.error("SVG to PNG error:", err);
    return NextResponse.json({ error: "Не удалось сконвертировать SVG" }, { status: 500 });
  }
}
