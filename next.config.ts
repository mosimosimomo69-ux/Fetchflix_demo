import type { NextConfig } from "next";

// Allowed hosts for images and media
const MEDIA_HOSTS = [
  "image.tmdb.org",
  "wsrv.nl",
];

// Content Security Policy – tightly scoped to only what this app needs
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://image.tmdb.org https://wsrv.nl;
  media-src 'self' blob: https:;
  connect-src 'self' https://api.themoviedb.org https://wsrv.nl https://image.tmdb.org;
  frame-src 'self' https://www.youtube.com https://player.vimeo.com https://vidsrc.to https://vidsrc.xyz https://vidsrc.me https://2embed.cc https://player.videasy.net;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers leaking referrer to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 2 years (including sub-domains)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable browser features we don't need
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
      "bluetooth=()",
    ].join(", "),
  },
  // Content Security Policy
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  // Block cross-origin info leaks
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" }, // needed for iframes (player embeds)
  // Remove X-Powered-By header (don't advertise tech stack)
  { key: "X-Powered-By", value: "" },
];

const nextConfig: NextConfig = {
  // Remove "X-Powered-By: Next.js" header from all responses
  poweredByHeader: false,

  images: {
    remotePatterns: MEDIA_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },

  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders.filter((h) => h.value !== ""),
      },
      {
        // API routes: additionally block CORS from unknown origins
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "same-origin" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
