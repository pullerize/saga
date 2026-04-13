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

  try {
    const pngBuffer = await sharp(Buffer.from(svg, "utf-8"), { density: 300 })
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
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
