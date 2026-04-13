import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  // Validate type
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Допустимые форматы: PNG, JPG, WebP, SVG, GIF" }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "png";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Ensure uploads dir exists
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Write file
  const bytes = await file.arrayBuffer();
  const filePath = path.join(uploadDir, name);
  await writeFile(filePath, Buffer.from(bytes));

  // Return public URL
  const url = `/uploads/${name}`;
  return NextResponse.json({ url, name });
}
