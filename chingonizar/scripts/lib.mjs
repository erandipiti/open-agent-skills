// lib.mjs: small helpers shared by the chingonizar scripts.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Which Chromium to drive. CHROME_PATH wins; otherwise the newest Chromium found in the Playwright
// cache (~/.cache/ms-playwright, e.g. after `npx playwright install chromium`).
export function chromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), '.cache', 'ms-playwright');
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => d.startsWith('chromium')).sort().reverse() : [];
  for (const d of dirs) {
    for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const p = path.join(base, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  throw new Error('No Chromium found. Set CHROME_PATH to a Chromium binary, or run `npx playwright install chromium`.');
}

// Stable, filesystem-safe name for a page URL: "home" for the root, else the path.
export function slugFor(u) {
  const url = new URL(u);
  const p = (url.pathname + (url.search || '')).replace(/\/+$/, '');
  if (!p) return 'home';
  return p.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).toLowerCase() || 'home';
}

// Social platform for a link, or null. Used to route links into the social lane.
export function socialPlatform(href) {
  let host;
  try { host = new URL(href).host.replace(/^www\.|^m\.|^es-la\.|^es\./, ''); } catch { return null; }
  const map = {
    'instagram.com': 'instagram', 'facebook.com': 'facebook', 'fb.com': 'facebook', 'fb.me': 'facebook',
    'tiktok.com': 'tiktok', 'youtube.com': 'youtube', 'youtu.be': 'youtube', 'x.com': 'x', 'twitter.com': 'x',
    'linkedin.com': 'linkedin', 'pinterest.com': 'pinterest', 'threads.net': 'threads',
    'wa.me': 'whatsapp', 'api.whatsapp.com': 'whatsapp', 'whatsapp.com': 'whatsapp',
    'maps.google.com': 'google-maps', 'goo.gl': 'google-maps', 'maps.app.goo.gl': 'google-maps',
    'g.page': 'google-business', 'linktr.ee': 'linktree',
  };
  if (host.startsWith('google.') && href.includes('/maps')) return 'google-maps';
  if (map[host]) return map[host];
  // Country subdomains (il.linkedin.com, mx.linkedin.com, es-la.facebook.com) map to the base platform.
  const base = Object.keys(map).find((k) => host.endsWith(`.${k}`));
  return base ? map[base] : null;
}
