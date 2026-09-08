import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// LiveKit signalling is ws/wss; media is UDP/WebRTC and not subject to CSP.
// Cloud connects to regional sub-domains, so allow the whole livekit.cloud
// zone plus whatever explicit URL is configured (covers self-hosted too).
const lkUrl = (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "").replace(/\/$/, "");
const lkHttp = lkUrl.replace(/^ws/, "http");
const lkSelfHost =
  lkUrl && !/livekit\.cloud/.test(lkUrl) ? `${lkUrl} ${lkHttp}` : "";

const connectSrc = [
  "'self'",
  "https://*.livekit.cloud",
  "wss://*.livekit.cloud",
  lkSelfHost,
]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  // Next.js/Turbopack inject inline bootstrap scripts. A nonce-based policy
  // needs request-time rewriting (proxy.ts); until then 'unsafe-inline' stays,
  // but 'unsafe-eval' is dev-only.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(self), display-capture=(self), geolocation=(), browsing-topics=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
