import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // App de recordatorios "Mi Día": PWA estática en public/recordatorios
      { source: "/recordatorios", destination: "/recordatorios/index.html" },
    ];
  },
};

export default nextConfig;
