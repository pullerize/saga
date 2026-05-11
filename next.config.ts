import type { NextConfig } from "next";
import path from "path";

// Защитные HTTP-заголовки на все ответы.
// Добавляем через next.config.headers() — работает и в dev, и в prod, не зависит
// от deprecated middleware/proxy API Next 16.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Standalone output: Next бандлит только нужные зависимости в .next/standalone/.
  // Удобно для VPS — запуск через `node .next/standalone/server.js` без полного node_modules.
  // В dev отключаем: file-tracing ломается на путях с кириллицей/пробелом + OneDrive,
  // уходит в родителя `my_project` и не находит node_modules для tailwindcss.
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  // Нативные бинарники держим вне бандла.
  serverExternalPackages: ["sharp", "@prisma/client", "prisma"],
  outputFileTracingRoot: path.resolve(__dirname),
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
