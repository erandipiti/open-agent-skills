#!/usr/bin/env node
// social.mjs: collect public, no-login evidence about each social profile the site links to.
//
// Usage: node social.mjs <run-dir> [extra-profile-url ...]
// Reads:  <run-dir>/links/inventory.json (social rows), plus any extra URLs passed in
//         (profiles found by web search that the site does not link to).
// Writes: <run-dir>/social/profiles.json and <run-dir>/social/<platform>-<n>.jpg screenshots.
//
// Evidence rules this script encodes (they exist because each one produced a false claim before):
// - We report the LATEST OBSERVED post date, never "last post": a login wall or pinned posts can
//   hide newer ones.
// - access = "login_wall" / "blocked" means UNKNOWN activity, never "inactive".
// - Counters (followers, posts) are copied verbatim from what the platform rendered, with the
//   source field they came from. Nothing is estimated.
// No login, no cookies, no CAPTCHA solving: we stop at the wall and say so.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { chromePath, socialPlatform } from './lib.mjs';

const [runDir, ...extra] = process.argv.slice(2);
if (!runDir) { console.error('usage: node social.mjs <run-dir> [profile-url ...]'); process.exit(64); }
const outDir = path.join(runDir, 'social');
fs.mkdirSync(outDir, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const invFile = path.join(runDir, 'links', 'inventory.json');
const inv = fs.existsSync(invFile) ? JSON.parse(fs.readFileSync(invFile, 'utf8')) : [];
// Profile URLs only: drop share/intent links and individual-post links that are not profiles.
const isShare = (u) => /sharer|share\?|intent\/tweet|\/dialog\/|plugins\//i.test(u);
const candidates = [...new Set([
  ...inv.filter((r) => r.type === 'social').map((r) => r.abs),
  ...extra,
])].filter((u) => !isShare(u));

const fetchText = async (u) => {
  try { const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }); return { status: r.status, text: await r.text() }; }
  catch (e) { return { status: 0, text: '', error: String(e) }; }
};

async function youtube(u, row) {
  // Public RSS gives the last 15 uploads with dates, no key needed. Resolve channel id first.
  let channelId = u.match(/channel\/(UC[\w-]{22})/)?.[1];
  if (!channelId) {
    const page = await fetchText(u);
    channelId = page.text.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/)?.[1] ?? page.text.match(/channel_id=(UC[\w-]{22})/)?.[1];
  }
  if (!channelId) { row.access = 'unresolved'; return; }
  const rss = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const dates = [...rss.text.matchAll(/<published>([^<]+)<\/published>/g)].map((m) => m[1]).slice(1); // [0] is the channel itself
  const titles = [...rss.text.matchAll(/<entry>[\s\S]*?<title>([^<]+)<\/title>/g)].map((m) => m[1]);
  row.access = rss.status === 200 ? 'public_feed' : 'blocked';
  row.channelId = channelId;
  row.observedPosts = dates.map((d, i) => ({ date: d, title: titles[i] ?? null }));
  row.latestObservedPost = dates[0] ?? null;
  row.source = 'youtube RSS feed (last 15 uploads)';
}

async function tiktokOembed(u, row) {
  const r = await fetchText(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`);
  try { const j = JSON.parse(r.text); row.oembed = { author_name: j.author_name ?? null, title: j.title ?? null }; } catch { row.oembed = null; }
}

const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
const rows = [];
try {
  for (const [n, u] of candidates.entries()) {
    const platform = socialPlatform(u) ?? 'other';
    const row = { url: u, platform, checkedAt: new Date().toISOString() };
    rows.push(row);
    if (platform === 'whatsapp') { row.access = 'n/a (chat link)'; continue; }
    // Website builders ship demo social bars pointing at THEIR OWN accounts (instagram.com/wix).
    // Those are template leftovers to report, not the client's profiles to analyze.
    if (/\/(@)?(wix|squarespace|wordpress|godaddy|weebly|hostinger|shopify|jimdo)(\/|\?|$)/i.test(new URL(u).pathname + '/')) {
      row.access = 'builder_default_link';
      row.pages = inv.filter((r) => r.abs === u).map((r) => r.page);
      continue;
    }
    if (platform === 'youtube') { await youtube(u, row); continue; }
    if (platform === 'tiktok') await tiktokOembed(u, row);
    // Render the public profile and read what the platform exposes without login.
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 900 });
    let resp = null;
    try { resp = await page.goto(u, { waitUntil: 'networkidle2', timeout: 40000 }); } catch (e) { row.gotoError = String(e).slice(0, 160); }
    await new Promise((r) => setTimeout(r, 2000));
    const seen = await page.evaluate(() => {
      const m = (n) => document.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content ?? null;
      const body = (document.body?.innerText || '').replace(/\s+/g, ' ');
      return {
        finalUrl: location.href,
        title: document.title,
        ogTitle: m('og:title'),
        ogDescription: m('og:description'),
        metaDescription: m('description'),
        // <time datetime> elements are the only machine-readable post dates most platforms render.
        timeElements: [...document.querySelectorAll('time[datetime]')].map((t) => t.getAttribute('datetime')).slice(0, 30),
        // Instagram's logged-out grid renders post links but no dates; the shortcode encodes the
        // post's creation time (decoded below), so these links are our dated evidence.
        postLinks: [...new Set([...document.querySelectorAll('a[href*="/p/"],a[href*="/reel/"]')].map((a) => a.getAttribute('href')))].slice(0, 30),
        loginWall: /log in|inicia sesi[oó]n|sign up|reg[ií]strate|see more from|ver m[aá]s de/i.test(body.slice(0, 3000)) && body.length < 6000,
        notFound: /page isn.t available|esta p[aá]gina no est[aá] disponible|couldn.t find this account|no se encontr|content isn.t available|sorry, this page/i.test(body.slice(0, 2000)),
        textSample: body.slice(0, 1500),
      };
    }).catch((e) => ({ evalError: String(e) }));
    Object.assign(row, { httpStatus: resp?.status() ?? null, ...seen });
    // Counters as the platform phrased them, e.g. "1,234 Followers, 56 Following, 789 Posts".
    const counterText = [seen.ogDescription, seen.metaDescription].filter(Boolean).join(' | ');
    row.countersVerbatim = [...new Set(counterText.match(/[\d.,]+\s?[KkMm]?\s+(followers|seguidores|following|seguidos|posts|publicaciones|likes|me gusta|Me gusta)/gi) || [])];
    // Instagram shortcode -> media id (base64url-ish alphabet) -> creation time:
    // ms = (id >> 23) + 1314220021721 (Instagram's epoch). Verified against posts whose captions
    // carry their own date. Pinned posts appear first in the grid, hence the sort.
    const IG_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const igDate = (code) => {
      let id = 0n;
      for (const ch of code.slice(0, 11)) { const v = IG_ALPHA.indexOf(ch); if (v < 0) return null; id = id * 64n + BigInt(v); }
      const ms = Number((id >> 23n) + 1314220021721n);
      return ms > 1.3e12 && ms < Date.now() + 864e5 ? new Date(ms).toISOString() : null;
    };
    if (platform === 'instagram') {
      row.observedPosts = (seen.postLinks || []).map((h) => ({ href: h, code: h.match(/\/(?:p|reel)\/([\w-]+)/)?.[1] }))
        .map((p) => ({ ...p, date: p.code ? igDate(p.code) : null })).filter((p) => p.date);
      seen.timeElements = [...(seen.timeElements || []), ...row.observedPosts.map((p) => p.date)];
    }
    const dates = (seen.timeElements || []).filter(Boolean).sort().reverse();
    row.latestObservedPost = dates[0] ?? null;
    row.observedPostCount = dates.length;
    row.access = seen.notFound ? 'not_found' : (seen.loginWall && !dates.length ? 'login_wall' : (dates.length || row.countersVerbatim.length ? 'partial_public' : 'no_data_visible'));
    row.source = 'rendered public profile, no login';
    const raw = path.join(outDir, `${platform}-${n}.raw.jpg`);
    const shot = path.join(outDir, `${platform}-${n}.jpg`);
    try {
      await page.screenshot({ path: raw, type: 'jpeg', quality: 70 });
      try { execFileSync('magick', [raw, '-resize', '800x800>', '-quality', '60', shot]); fs.unlinkSync(raw); } catch { fs.renameSync(raw, shot); }
      row.screenshot = path.relative(runDir, shot);
    } catch {}
    await page.close();
  }
} finally { await browser.close(); }

fs.writeFileSync(path.join(outDir, 'profiles.json'), JSON.stringify(rows, null, 2));
console.log(JSON.stringify({ ok: true, profiles: rows.length, byAccess: rows.reduce((a, r) => ({ ...a, [r.access]: (a[r.access] ?? 0) + 1 }), {}) }));
