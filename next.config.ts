import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "mammoth"],
  // Keep the development-only Next.js indicator out of the lower-left corner.
  devIndicators: false,
};

export default nextConfig;
