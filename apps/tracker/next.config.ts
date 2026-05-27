import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@t3-oss/env-core", "@t3-oss/env-nextjs", "better-auth"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.jacobc.co.za",
        port: "",
      },
    ],
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
