import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Content Security Policy.
 *
 * 'unsafe-inline'/'unsafe-eval' stay for scripts because Next's bootstrap
 * is inline and the dev build evaluates modules; the value here is in the
 * host allowlist, which stops an injected script from talking to anywhere
 * except our own Supabase project.
 *
 * blob: is required in two places that aren't obvious: troika (the 3D text
 * renderer) parses fonts in a worker created from a blob, and the share
 * card is handed to the browser as a blob URL.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHost} ${supabaseHost.replace("https://", "wss://")}`,
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // no one should be able to frame the site and trick a visitor
          // into clicking through an invisible overlay
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
