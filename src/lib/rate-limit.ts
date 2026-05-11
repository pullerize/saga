import { NextResponse } from "next/server";

/**
 * Простейший in-memory rate-limit для одиночного инстанса Node.
 * Для горизонтального масштабирования заменить на Redis (Upstash, Redis-cluster).
 *
 * Использование:
 *   const limited = rateLimit("calc", req, { limit: 30, windowMs: 60_000 });
 *   if (limited) return limited; // вернёт NextResponse 429
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Периодически чистим устаревшие бакеты, чтобы не утекала память.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key);
  }
  lastSweep = now;
}

function getClientKey(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function rateLimit(
  scope: string,
  req: Request,
  opts: { limit: number; windowMs: number },
): NextResponse | null {
  sweep();
  const key = `${scope}:${getClientKey(req)}`;
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }
  if (existing.count >= opts.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Слишком много запросов, попробуйте позже" },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }
  existing.count += 1;
  return null;
}
