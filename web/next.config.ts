import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/security/contentSecurityPolicy";

const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
const contentSecurityPolicy = buildContentSecurityPolicy(
  process.env.NODE_ENV === 'development',
  supabaseOrigin,
);

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
    workerThreads: true,
    webpackBuildWorker: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
