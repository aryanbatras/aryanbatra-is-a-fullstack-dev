import type { NextApiRequest, NextApiResponse } from "next";

/**
 * /api/proxy?url=https://github.com/aryanbatras
 *
 * Server-side proxy that fetches any URL and returns the content with
 * all iframe-blocking headers stripped. The browser never sees
 * X-Frame-Options or Content-Security-Policy: frame-ancestors because
 * our server strips them before the response reaches the client.
 *
 * Relative URLs in the HTML are rewritten to absolute so assets (CSS,
 * JS, images) load correctly when the page is embedded in our iframe.
 */

/** Max age for the CORS + cache headers (5 minutes). */
const CACHE_MAX_AGE = 300;

/** Headers we strip from the upstream response. */
const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-security-policy",
  "x-webkit-csp",
]);

/** Rewrite relative src/href/srcset to absolute. */
function rewriteUrls(html: string, base: string): string {
  const url = new URL(base);
  const origin = url.origin;
  const baseDir = url.pathname.replace(/\/[^/]*$/, "/");

  // Rewrite relative paths in common attributes
  let result = html;

  // src="path" or src='./path' (but not src="http..." or src="data:")
  result = result.replace(
    /((?:src|href|poster|action|background|data-src|data-href))="((?![a-z]+:|data:|#)[^"]*)"/gi,
    (_, attr, path) => {
      try {
        const resolved = new URL(path, origin + baseDir).href;
        return `${attr}="${resolved}"`;
      } catch {
        return `${attr}="${path}"`;
      }
    },
  );

  // srcset="path 1x, path 2x" — rewrite each URL
  result = result.replace(
    /srcset="([^"]*)"/gi,
    (_, val) => {
      const rewritten = val
        .split(",")
        .map((entry: string) => {
          const parts = entry.trim().split(/\s+/);
          if (parts.length === 0) return entry;
          const imgUrl = parts[0];
          if (/^[a-z]+:|^data:|^#/i.test(imgUrl)) return entry;
          try {
            const resolved = new URL(imgUrl, origin + baseDir).href;
            return [resolved, ...parts.slice(1)].join(" ");
          } catch {
            return entry;
          }
        })
        .join(", ");
      return `srcset="${rewritten}"`;
    },
  );

  // url(path) in inline styles
  result = result.replace(
    /url\((['"]?)(?!data:|blob:|#|http|\/\/)([^'")\s]+)\1\)/gi,
    (m, q, path) => {
      try {
        const resolved = new URL(path, origin + baseDir).href;
        return `url(${q}${resolved}${q})`;
      } catch {
        return m;
      }
    },
  );

  // Rewrite <base href="..."> to point to the original site
  result = result.replace(
    /(<base\s[^>]*href=")([^"]*)(")/i,
    (m, pre, href, post) => {
      try {
        const resolved = new URL(href, base).href;
        return `${pre}${resolved}${post}`;
      } catch {
        return m;
      }
    },
  );

  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const targetUrl = req.query.url as string | undefined;

  if (!targetUrl) {
    res.status(400).json({ error: "Missing ?url= parameter" });
    return;
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    res.status(400).json({ error: "Only http/https URLs allowed" });
    return;
  }

  try {
    // Fetch the target page server-side — X-Frame-Options doesn't apply
    // here because we're not rendering it in a browser iframe.
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const status = upstream.status;

    // Set CORS headers so the iframe can access this from our origin
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, HEAD, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Range",
    );

    // Cache for a short time to reduce repeated fetches
    res.setHeader(
      "Cache-Control",
      `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
    );

    // Explicitly DO NOT set X-Frame-Options or CSP — that's the whole point

    // For non-HTML responses (images, CSS, JS, etc.), just pass through
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      // Pass through the upstream response as-is
      const body = await upstream.arrayBuffer();
      // Strip blocking headers
      for (const h of STRIP_HEADERS) {
        res.removeHeader(h);
      }
      res.setHeader("Content-Type", contentType);
      res.status(status).send(Buffer.from(body));
      return;
    }

    // For HTML responses: rewrite URLs and strip blocking headers
    let html = await upstream.text();

    // Rewrite relative URLs to absolute
    const baseHref =
      upstream.headers.get("x-final-url") ?? targetUrl;
    html = rewriteUrls(html, baseHref);

    // Inject <base> tag to ensure relative links resolve to the original site
    const baseTag = `<base href="${baseHref}">`;
    if (html.includes("<head")) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    } else if (html.includes("<html")) {
      html = html.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`);
    } else {
      html = `${baseTag}\n${html}`;
    }

    // Strip blocking headers from our response
    for (const h of STRIP_HEADERS) {
      res.removeHeader(h);
    }

    // Remove any meta CSP tags from the HTML too
    html = html.replace(
      /<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
      "",
    );

    // Inject anti-detection script — patches sites that check if they're
    // inside an iframe (window.parent === window, window.top, etc.)
    const antiDetectScript = `<script data-proxy-injected>
(function() {
  // Make the page believe it's the top frame
  try { Object.defineProperty(window, 'top', { get: function() { return window; }, configurable: true }); } catch(e) {}
  try { Object.defineProperty(window, 'parent', { get: function() { return window; }, configurable: true }); } catch(e) {}
  // Patch hasFocus to always return true
  try { Document.prototype.hasFocus = function() { return true; }; } catch(e) {}
  // Patch fullscreen detection
  try {
    Object.defineProperty(document, 'fullscreenElement', { get: function() { return document.documentElement; }, configurable: true });
    Object.defineProperty(document, 'webkitFullscreenElement', { get: function() { return document.documentElement; }, configurable: true });
  } catch(e) {}
})();
</script>`;

    if (html.includes("<head")) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${antiDetectScript}`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Proxy fetch failed";
    console.error(`[proxy] Failed to fetch ${targetUrl}:`, msg);
    res.status(502).json({ error: `Failed to fetch: ${msg}` });
  }
}

export const config = {
  api: {
    // Disable body parsing for large responses
    responseLimit: false,
  },
};
