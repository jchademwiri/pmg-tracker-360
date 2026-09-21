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
  /* config options here */
  transpilePackages: ["@pmg/pdf"],
  serverExternalPackages: ["takumi-pdf"],
  reactCompiler: true,
};

export default nextConfig;
