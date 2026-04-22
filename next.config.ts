import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  // Standalone output: Next бандлит только нужные зависимости в .next/standalone/.
  // Удобно для VPS — запуск через `node .next/standalone/server.js` без полного node_modules.
  output: "standalone",
  // Нативные бинарники держим вне бандла.
  serverExternalPackages: ["sharp", "@prisma/client", "prisma"],
};

export default nextConfig;
