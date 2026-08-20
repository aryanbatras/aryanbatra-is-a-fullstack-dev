import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * /api/game-resolve?url=https://www.onlinegames.io/snake/
 *
 * Fetches the game page, extracts the actual <iframe> src (the real game),
 * strips X-Frame-Options/CSP, injects anti-detection, and returns the
 * playable HTML — no onlinegames.io chrome visible.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    // 1. Fetch the game page
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    if (!pageRes.ok) {
      return res.status(pageRes.status).json({ error: `Upstream returned ${pageRes.status}` });
    }

    const html = await pageRes.text();

    // 2. Extract the actual game iframe src
    // onlinegames.io embeds games in iframes like:
    //   <iframe src="https://cloud.onlinegames.io/games/2025/html/snake/index.html" ...>
    // We need to find this and extract just the game, not the wrapper page.

    const iframeMatch = html.match(
      /<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*(?:id=["']gameFrame["'])?[^>]*>/i
    );

    // Also try data-src patterns
    const dataSrcMatch = html.match(
      /data-src=["']([^"']*cloud\.onlinegames\.io[^"']+)["']/i
    );

    // Try to find any cloud.onlinegames.io URL
    const cloudMatch = html.match(
      /(https?:\/\/cloud\.onlinegames\.io\/[^"'\s]+)/i
    );

    let gameUrl = '';

    if (dataSrcMatch) {
      gameUrl = dataSrcMatch[1];
    } else if (iframeMatch && iframeMatch[1].includes('cloud.onlinegames.io')) {
      gameUrl = iframeMatch[1];
    } else if (cloudMatch) {
      gameUrl = cloudMatch[1];
    } else if (iframeMatch) {
      gameUrl = iframeMatch[1];
    }

    if (!gameUrl) {
      // Fallback: serve the page itself but stripped
      res.setHeader('X-Frame-Options', '');
      res.setHeader('Content-Security-Policy', '');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // 3. Make relative URLs absolute
    if (gameUrl.startsWith('//')) gameUrl = 'https:' + gameUrl;
    else if (gameUrl.startsWith('/')) {
      const base = new URL(url);
      gameUrl = base.origin + gameUrl;
    }

    // 4. Fetch the actual game HTML
    const gameRes = await fetch(gameUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,*/*',
        'Referer': url,
      },
    });

    if (!gameRes.ok) {
      // If game fetch fails, redirect to the original page through proxy
      res.setHeader('X-Frame-Options', '');
      res.setHeader('Content-Security-Policy', '');
      res.redirect(302, `/api/proxy?url=${encodeURIComponent(url)}`);
      return;
    }

    let gameHtml = await gameRes.text();

    // 5. Inject anti-detection script + base tag for relative resources
    const gameBase = gameUrl.substring(0, gameUrl.lastIndexOf('/') + 1);
    const antiDetect = `<script data-proxy-injected>
(function() {
  try { Object.defineProperty(window, 'top', { get: function() { return window; }, configurable: true }); } catch(e) {}
  try { Object.defineProperty(window, 'parent', { get: function() { return window; }, configurable: true }); } catch(e) {}
  try { Document.prototype.hasFocus = function() { return true; }; } catch(e) {}
  try {
    Object.defineProperty(document, 'fullscreenElement', { get: function() { return document.documentElement; }, configurable: true });
    Object.defineProperty(document, 'webkitFullscreenElement', { get: function() { return window; }, configurable: true });
  } catch(e) {}
  try { if (!document.querySelector('base')) { var b = document.createElement('base'); b.href = '${gameBase}'; document.head.prepend(b); } } catch(e) {}
})();
</script>`;

    // Inject at the start of <head>
    gameHtml = gameHtml.replace(/<head[^>]*>/i, (match) => match + antiDetect);

    // Remove any X-Frame-Options or CSP meta tags
    gameHtml = gameHtml.replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');
    gameHtml = gameHtml.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

    // 6. Serve the resolved game
    res.setHeader('X-Frame-Options', '');
    res.setHeader('Content-Security-Policy', '');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(gameHtml);

  } catch (err) {
    console.error('[game-resolve]', err);
    res.status(500).json({ error: 'Failed to resolve game' });
  }
}
