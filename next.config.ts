import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The landing page lists public/images/ours at request time (lib/our-photos.ts).
  // On Vercel, public/ is served from the CDN and isn't part of the function bundle,
  // so include that folder explicitly.
  outputFileTracingIncludes: {
    "/": ["./public/images/ours/**/*"],
  },
};

export default nextConfig;
