import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@pmg/pdf"],
  serverExternalPackages: ["takumi-pdf"],
  reactCompiler: true,
};

export default nextConfig;
