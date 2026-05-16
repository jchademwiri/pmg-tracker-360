import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // typedRoutes is now enabled by default in Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.jacobc.co.za',
        port: '',
      },
    ],
  },
  // Enable the new App Router Instrumentation V2
  experimental: {
    // Enhanced Server and Client Actions
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Optimized Module Resolution
    optimizePackageImports: [
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
    ],
  },
};

export default nextConfig;
