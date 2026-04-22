import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  const body = await req.json();
  const { svgContent } = body;

  if (!svgContent) {
    return NextResponse.json({ error: "No SVG" }, { status: 400 });
  }

  let svg = svgContent;
  if (!svg.includes("xmlns=")) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Read the SVG's intrinsic size from width/height or viewBox to keep the
  // raster output sane for huge viewBoxes (some source SVGs have widths like 19429px
  // which at density=300 would blow past sharp's pixel limit).
  function readSvgSize(s: string): { w: number; h: number } {
    const wMatch = s.match(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i);
    const hMatch = s.match(/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i);
    if (wMatch && hMatch) return { w: parseFloat(wMatch[1]), h: parseFloat(hMatch[1]) };
    const vb = s.match(/viewBox\s*=\s*["']([^"']+)["']/i);
    if (vb) {
      const parts = vb[1].split(/[\s,]+/).map(Number);
      if (parts.length >= 4) return { w: parts[2], h: parts[3] };
    }
    return { w: 1000, h: 1000 };
  }

  const MAX_SIDE = 1600; // max PNG side, keeps files small and respects sharp's pixel limit
  const { w: svgW, h: svgH } = readSvgSize(svg);
  const scale = Math.min(MAX_SIDE / svgW, MAX_SIDE / svgH, 1);
  const outW = Math.max(1, Math.round(svgW * scale));
  const outH = Math.max(1, Math.round(svgH * scale));

  // librsvg inside sharp treats width/height attributes as pixel dimensions. For huge
  // SVGs (e.g. 21000 × 13000) that blows past the 268 MP hard limit even with
  // `unlimited: true`. Replace them with the downscaled render target while keeping
  // viewBox so the drawing isn't distorted.
  svg = svg.replace(/(<svg[^>]*\s)width\s*=\s*["'][^"']*["']/i, `$1width="${outW}"`);
  svg = svg.replace(/(<svg[^>]*\s)height\s*=\s*["'][^"']*["']/i, `$1height="${outH}"`);

  try {
    const pngBuffer = await sharp(Buffer.from(svg, "utf-8"), {
      density: 72,
      unlimited: true,
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
    console.error("SVG to PNG error:", err);
    return NextResponse.json({ error: "Conversion failed", details: String(err) }, { status: 500 });
  }
}
