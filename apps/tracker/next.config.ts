import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/**",
    ],
  },
  transpilePackages: ["@pmg/pdf", "@t3-oss/env-core", "@t3-oss/env-nextjs", "better-auth"],
  serverExternalPackages: ["takumi-pdf"],
  images: {
    remotePatterns: [],
  },
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    optimizePackageImports: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "lucide-react",
    ],
  },
};

export default nextConfig;
