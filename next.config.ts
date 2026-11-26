import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Optimisations invisibles côté visiteur : le manifeste llms.txt reste servi
  // au chemin standard /llms.txt (aucun lien visible dans l'interface).
  async rewrites() {
    return [
      { source: "/llms.txt", destination: "/api/llms.txt" },
      { source: "/llms-full.txt", destination: "/api/llms-full.txt" },
    ];
  },
};

export default nextConfig;
