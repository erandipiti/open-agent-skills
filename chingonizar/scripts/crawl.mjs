#!/usr/bin/env node
// crawl.mjs: discover the site's pages and choose which ones get the full (rendered) audit.
//
// Usage: node crawl.mjs <start-url> <run-dir> [--max=25] [--list-max=100]
// Output: <run-dir>/crawl/{robots.txt, sitemap-urls.json, urls.json, selected.json, skipped.json}
//
// Discovery = robots.txt Sitemap lines + /sitemap.xml variants (incl. sitemap indexes) + links
// found on the rendered start page. Selection keeps the start page, every nav/header target, and
// at most 3 pages per URL template (/blog/*, /producto/*), so a 400-product catalog does not
// burn the budget on identical pages. Everything NOT selected is written to skipped.json so the
// report can say "not checked" instead of implying "fine".

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { chromePath } from './lib.mjs';

const [start, runDir, ...flags] = process.argv.slice(2);
if (!start || !runDir) { console.error('usage: node crawl.mjs <url> <run-dir> [--max=25]'); process.exit(64); }
const num = (n, d) => Number(flags.find((f) => f.startsWith(`--${n}=`))?.split('=')[1] ?? d);
const MAX = num('max', 25);
const LIST_MAX = num('list-max', 100);
const dir = path.join(runDir, 'crawl');
fs.mkdirSync(dir, { recursive: true });

const origin = new URL(start).origin;
const host = new URL(start).host.replace(/^www\./, '');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return { status: r.status, url: r.url, text: await r.text() };
  } catch (e) { return { status: 0, error: String(e) }; }
};
// Normalize: drop hash and tracking params, trailing slash, so duplicates collapse.
const norm = (u) => {
  try {
    const x = new URL(u, start);
    x.hash = '';
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid|gclid|wbraid|gbraid|msclkid|ref$|_ga)/.test(k)) x.searchParams.delete(k);
    x.searchParams.sort();
    let s = x.href;
    if (s.endsWith('/') && x.pathname !== '/') s = s.slice(0, -1);
    return s;
  } catch { return null; }
};
const sameSite = (u) => { try { return new URL(u).host.replace(/^www\./, '') === host; } catch { return false; } };
// Skip files and obvious crawl traps (calendars, filters, carts, logins).
const crawlable = (u) => !/\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|docx?|xlsx?)(\?|$)/i.test(u)
  && !/[?&](date|month|year|filter|orderby|sort|add-to-cart|replytocom)=/i.test(u)
  && !/\/(wp-admin|wp-login|cart|carrito|checkout|account|mi-cuenta|login|feed)(\/|$)/i.test(u);

// 1) robots.txt
const robots = await get(`${origin}/robots.txt`);
fs.writeFileSync(path.join(dir, 'robots.txt'), robots.text ?? `# fetch failed: ${robots.error ?? robots.status}`);
const disallow = (robots.status === 200 ? robots.text : '').split('\n')
  .map((l) => l.trim()).filter((l) => /^disallow:/i.test(l)).map((l) => l.split(':').slice(1).join(':').trim()).filter(Boolean);
const sitemapSeeds = new Set((robots.status === 200 ? robots.text : '').split('\n').filter((l) => /^sitemap:/i.test(l.trim())).map((l) => l.split(/:(.+)/)[1].trim()));
for (const p of ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']) sitemapSeeds.add(origin + p);

// 2) sitemaps (follow up to 10 child sitemaps of an index)
const sitemapUrls = [];
const lastmods = {};
const seenMaps = new Set();
const queue = [...sitemapSeeds];
while (queue.length && seenMaps.size < 12) {
  const sm = queue.shift();
  if (seenMaps.has(sm)) continue;
  seenMaps.add(sm);
  const r = await get(sm);
  if (r.status !== 200 || !/<(urlset|sitemapindex)/.test(r.text ?? '')) continue;
  for (const m of r.text.matchAll(/<sitemap>[\s\S]*?<loc>\s*([^<]+?)\s*<\/loc>/g)) queue.push(m[1]);
  for (const m of r.text.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1];
    const lm = m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1];
    if (loc) { const n = norm(loc); if (n) { sitemapUrls.push(n); if (lm) lastmods[n] = lm; } }
  }
}
fs.writeFileSync(path.join(dir, 'sitemap-urls.json'), JSON.stringify({ sitemapsRead: [...seenMaps], count: sitemapUrls.length, lastmods }, null, 2));

// 3) links on the rendered start page (JS-built menus are invisible to a plain fetch)
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
let navLinks = [];
let pageLinks = [];
try {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.goto(start, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  const found = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, nav: !!a.closest('nav,header') })));
  navLinks = found.filter((f) => f.nav).map((f) => f.href);
  pageLinks = found.map((f) => f.href);
} finally { await browser.close(); }

const startN = norm(start);
const isAllowed = (u) => { const p = new URL(u).pathname; return !disallow.some((d) => d !== '/' && p.startsWith(d)); };
const all = [...new Set([startN, ...navLinks.map(norm), ...pageLinks.map(norm), ...sitemapUrls])]
  .filter(Boolean).filter(sameSite).filter(crawlable);
fs.writeFileSync(path.join(dir, 'urls.json'), JSON.stringify(all, null, 2));

// 4) select: start + nav targets first, then fill by template (first path segment), max 3 each
const template = (u) => { const segs = new URL(u).pathname.split('/').filter(Boolean); return segs.length <= 1 ? `/${segs[0] ?? ''}` : `/${segs[0]}/*`; };
const selected = [];
const perTemplate = {};
const add = (u, why) => {
  if (selected.length >= MAX || selected.some((s) => s.url === u) || !isAllowed(u)) return;
  const t = template(u);
  if ((perTemplate[t] ?? 0) >= 3 && why !== 'start' && why !== 'nav') return;
  perTemplate[t] = (perTemplate[t] ?? 0) + 1;
  selected.push({ url: u, why, template: t });
};
add(startN, 'start');
for (const u of navLinks.map(norm).filter(Boolean).filter(sameSite).filter(crawlable)) add(u, 'nav');
for (const u of all) add(u, 'sample');
const skipped = all.filter((u) => !selected.some((s) => s.url === u)).slice(0, LIST_MAX);
fs.writeFileSync(path.join(dir, 'selected.json'), JSON.stringify(selected, null, 2));
fs.writeFileSync(path.join(dir, 'skipped.json'), JSON.stringify({ count: all.length - selected.length, listed: skipped, disallow }, null, 2));
console.log(JSON.stringify({ ok: true, discovered: all.length, selected: selected.length, sitemapUrls: sitemapUrls.length, robotsStatus: robots.status }));
