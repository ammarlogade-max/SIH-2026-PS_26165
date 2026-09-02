import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep tracing within this project when another lockfile exists higher in the user profile.
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pdf-parse", "mammoth"],
  // Keep the development-only Next.js indicator out of the lower-left corner.
  devIndicators: false,
};

export default nextConfig;
