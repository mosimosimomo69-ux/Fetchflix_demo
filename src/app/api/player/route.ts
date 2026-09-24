import { NextResponse } from "next/server";
import { rateLimit, parsePositiveInt } from "@/lib/security";

export async function GET(req: Request) {
  const limited = rateLimit(req, 120, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") || "vidnest";
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";
  const id = searchParams.get("id") || "";
  const season = parsePositiveInt(searchParams.get("season")) || 1;
  const episode = parsePositiveInt(searchParams.get("episode")) || 1;

  if (!id || !/^[a-zA-Z0-9_\-]+$/.test(id)) {
    return new Response("Invalid id parameter", { status: 400 });
  }

  let targetUrl = "";
  let baseOrigin = "";

  if (server === "vidnest" || server === "movies111" || server === "cloudplay") {
    targetUrl = type === "tv"
      ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
      : `https://vidnest.fun/movie/${id}`;
    baseOrigin = "https://vidnest.fun";
  } else if (server === "vidrock" || server === "streamboxhd") {
    targetUrl = type === "tv"
      ? `https://vidrock.to/tv/${id}/${season}/${episode}`
      : `https://vidrock.to/movie/${id}`;
    baseOrigin = "https://vidrock.to";
  } else {
    return new Response("Server not supported for proxying", { status: 400 });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": baseOrigin,
      },
    });

    if (!upstreamRes.ok) {
      return new Response(`Upstream player error: ${upstreamRes.status}`, { status: upstreamRes.status });
    }

    let html = await upstreamRes.text();

    // 1. Base tag injection so all scripts, styles, chunks load from original domain
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${baseOrigin}/">`);
    } else {
      html = `<base href="${baseOrigin}/">` + html;
    }

    // 2. High-priority Ad-Shield Script to neutralize window.open and top navigation
    const shieldScript = `
<script>
  (function() {
    'use strict';
    // Permanent no-op for window.open
    var blockedOpen = function() {
      console.warn('[FetchFlix Shield] Blocked ad/popup window.open attempt');
      return null;
    };
    try {
      window.open = blockedOpen;
      Object.defineProperty(window, 'open', {
        value: blockedOpen,
        writable: false,
        configurable: false
      });
    } catch(e) {}

    // Prevent top navigation takeover
    try {
      window.top = window.self;
    } catch(e) {}

    // Block any dynamic ad script insertions
    var origAppend = document.head.appendChild.bind(document.head);
    document.head.appendChild = function(node) {
      if (node && node.nodeName === 'SCRIPT' && node.src) {
        var src = String(node.src).toLowerCase();
        if (src.includes('hai8g.com') || src.includes('chiripaethenes.com') || src.includes('aclib.js') || src.includes('streaming-1.workers.dev')) {
          console.warn('[FetchFlix Shield] Blocked ad script injection:', node.src);
          return node;
        }
      }
      return origAppend(node);
    };
  })();
</script>`;

    if (html.includes("<head>")) {
      html = html.replace("<head>", "<head>" + shieldScript);
    } else {
      html = shieldScript + html;
    }

    // 3. Strip and neutralize specific known ad scripts from HTML
    // Neutralize VidNest popup ad chunk completely
    html = html.replaceAll("/_next/static/chunks/47fb01a2314683e3.js", "data:text/javascript,/*neutralized*/");
    // Strip and neutralize VidRock ad scripts
    html = html.replace(/<script[^>]*src="[^"]*aclib\.js"[^>]*><\/script>/gi, "");
    html = html.replaceAll("/lib/aclib.js", "data:text/javascript,/*neutralized*/");

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err: any) {
    console.error("Player proxy error:", err);
    return new Response("Failed to load player proxy: " + (err?.message || "Unknown error"), { status: 502 });
  }
}
