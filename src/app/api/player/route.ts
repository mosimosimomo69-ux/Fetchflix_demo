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
  } else if (server === "peachify" || server === "streamvault") {
    targetUrl = type === "tv"
      ? `https://peachify.pro/embed/tv/${id}/${season}/${episode}`
      : `https://peachify.pro/embed/movie/${id}`;
    baseOrigin = "https://peachify.pro";
  } else if (server === "vidking" || server === "videasy" || server === "mediahub") {
    targetUrl = type === "tv"
      ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
      : `https://player.videasy.to/movie/${id}`;
    baseOrigin = "https://player.videasy.to";
  } else if (server === "vidfast") {
    targetUrl = type === "tv"
      ? `https://vidfast.pro/tv/${id}/${season}/${episode}`
      : `https://vidfast.pro/movie/${id}`;
    baseOrigin = "https://vidfast.pro";
  } else if (server === "vidlink") {
    targetUrl = type === "tv"
      ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`
      : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`;
    baseOrigin = "https://vidlink.pro";
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

    // 2. High-priority Ad-Shield & Cinejoy-Grade Ultra-Buffer Engine
    const shieldScript = `
<script>
  (function() {
    'use strict';

    /* =======================================================================
       A. FetchFlix Security & Ad-Shield (Blocks popups and malicious scripts)
       ======================================================================= */
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

    try {
      window.top = window.self;
    } catch(e) {}

    var origAppend = document.head.appendChild.bind(document.head);
    document.head.appendChild = function(node) {
      if (node && node.nodeName === 'SCRIPT' && node.src) {
        var src = String(node.src).toLowerCase();
        if (
          src.includes('hai8g.com') ||
          src.includes('chiripaethenes.com') ||
          src.includes('aclib.js') ||
          src.includes('llvpn.com') ||
          src.includes('streaming-1.workers.dev')
        ) {
          console.warn('[FetchFlix Shield] Blocked ad script injection:', node.src);
          return node;
        }
      }
      return origAppend(node);
    };

    /* =======================================================================
       B. Cinejoy-Grade Ultra-Buffer & Zero-Stall HLS Engine
       ======================================================================= */
    // Inspired by Cinejoy's ultra-resilient buffer architecture:
    // - 120s forward buffer (2 minutes of video pre-cached!)
    // - 240s maximum buffer limit (up to 4 minutes ahead in memory)
    // - 60MB max buffer size
    // - Automatic micro-gap hole jumping (0.5s)
    // - 10x aggressive segment chunk retries with exponential backoff
    var CINEJOY_ULTRA_BUFFER = {
      autoStartLoad: true,
      maxBufferLength: 120, // 2 minutes forward buffer
      maxMaxBufferLength: 240, // 4 minutes maximum buffer limit
      maxBufferSize: 60 * 1000 * 1000, // 60MB chunk cache
      maxBufferHole: 0.5, // smoothly bridge micro-gaps without freezing
      highBufferWatchdogPeriod: 2,
      nudgeMaxRetry: 10,
      nudgeOffset: 0.1,
      fragLoadPolicy: {
        default: {
          maxLoadTimeMs: 30000,
          maxTimeToFirstByteMs: 10000,
          errorRetry: {
            maxNumRetry: 10,
            retryDelayMs: 1000,
            maxRetryDelayMs: 10000
          },
          timeoutRetry: {
            maxNumRetry: 10,
            maxRetryDelayMs: 0,
            retryDelayMs: 0
          }
        }
      }
    };

    function enhanceHlsConstructor(HlsClass) {
      if (!HlsClass || HlsClass.__fetchflix_enhanced) return HlsClass;

      if (HlsClass.DefaultConfig) {
        Object.assign(HlsClass.DefaultConfig, CINEJOY_ULTRA_BUFFER);
      }

      var OrigHls = HlsClass;
      var EnhancedHls = function(cfg) {
        var merged = Object.assign({}, CINEJOY_ULTRA_BUFFER, cfg || {});
        var instance = new OrigHls(merged);

        if (typeof instance.on === 'function') {
          var errEvent = OrigHls.Events && OrigHls.Events.ERROR ? OrigHls.Events.ERROR : 'hlsError';
          instance.on(errEvent, function(event, data) {
            if (data && data.fatal) {
              var netErr = OrigHls.ErrorTypes && OrigHls.ErrorTypes.NETWORK_ERROR ? OrigHls.ErrorTypes.NETWORK_ERROR : 'networkError';
              var mediaErr = OrigHls.ErrorTypes && OrigHls.ErrorTypes.MEDIA_ERROR ? OrigHls.ErrorTypes.MEDIA_ERROR : 'mediaError';

              if (data.type === netErr) {
                console.log('[FetchFlix UltraBuffer] Transient network stall, auto-resuming stream buffer...');
                instance.startLoad();
              } else if (data.type === mediaErr) {
                console.log('[FetchFlix UltraBuffer] Media gap encountered, auto-recovering media buffer...');
                instance.recoverMediaError();
              }
            }
          });
        }

        return instance;
      };

      Object.assign(EnhancedHls, OrigHls);
      EnhancedHls.prototype = OrigHls.prototype;
      EnhancedHls.__fetchflix_enhanced = true;
      return EnhancedHls;
    }

    var _hls = window.Hls ? enhanceHlsConstructor(window.Hls) : undefined;
    try {
      Object.defineProperty(window, 'Hls', {
        get: function() { return _hls; },
        set: function(v) { _hls = enhanceHlsConstructor(v); },
        configurable: true,
        enumerable: true
      });
    } catch(e) {
      window.Hls = _hls;
    }

    /* =======================================================================
       C. Native HTML5 Video Preload & Anti-Stall Watchdog
       ======================================================================= */
    function configureVideo(video) {
      if (!video || video.__fetchflix_configured) return;
      video.__fetchflix_configured = true;
      video.preload = 'auto';

      video.addEventListener('waiting', function() {
        if (!video.paused && video.readyState >= 2) {
          video.play().catch(function() {});
        }
      });

      video.addEventListener('stalled', function() {
        if (!video.paused && video.currentTime > 0) {
          video.currentTime += 0.05;
        }
      });
    }

    document.addEventListener('play', function(e) {
      if (e.target && e.target.nodeName === 'VIDEO') configureVideo(e.target);
    }, true);

    document.addEventListener('loadedmetadata', function(e) {
      if (e.target && e.target.nodeName === 'VIDEO') configureVideo(e.target);
    }, true);
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
