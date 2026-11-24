#!/usr/bin/env node
// probe.mjs: render one page at several viewports and record everything a website audit needs
// from the live DOM, as JSON evidence. It never clicks, types or submits anything: it only
// navigates, reads and screenshots, so it is safe to point at a client's production site.
//
// Usage: node probe.mjs <url> <run-dir> [--shots] [--viewports=360x800,768x1024,1366x768]
// Output: <run-dir>/pages/<slug>/probe.json  and, with --shots, <run-dir>/shots/<slug>-<WxH>.jpg
//
// Why our own script instead of a shared browser daemon: a shared browser may be driven by other
// agents at the same time, while this script launches its own private browser per
// run, so parallel page probes cannot step on each other's tabs.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { chromePath, slugFor } from './lib.mjs';

const [url, runDir, ...flags] = process.argv.slice(2);
if (!url || !runDir) {
  console.error('usage: node probe.mjs <url> <run-dir> [--shots] [--viewports=WxH,...]');
  process.exit(64);
}
const wantShots = flags.includes('--shots');
const vpFlag = flags.find((f) => f.startsWith('--viewports='));
// 360 = low-end Android (most common in MX), 768 = tablet portrait, 1366 = most common laptop.
const viewports = (vpFlag ? vpFlag.split('=')[1] : '360x800,768x1024,1366x768')
  .split(',')
  .map((s) => {
    const [width, height] = s.split('x').map(Number);
    return { width, height, mobile: width < 700 };
  });

const slug = slugFor(url);
const pageDir = path.join(runDir, 'pages', slug);
const shotDir = path.join(runDir, 'shots');
fs.mkdirSync(pageDir, { recursive: true });
if (wantShots) fs.mkdirSync(shotDir, { recursive: true });

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; SM-A145M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

// Runs inside the page. Pure DOM reads; returns plain JSON. Kept as one function so it can be
// serialized by puppeteer. Each field is raw evidence, not a judgment: the agent judges later.
function extract(firstPass) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const abs = (h) => {
    try { return new URL(h, location.href).href; } catch { return h; }
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();

  // Layout facts that change per viewport.
  const layout = {
    viewport: `${vw}x${vh}`,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > vw + 1,
    pageHeight: document.documentElement.scrollHeight,
    bodyFontSizePx: parseFloat(getComputedStyle(document.body).fontSize),
  };
  // Primary contact/conversion actions and whether they are visible without scrolling.
  const actionSel = 'a[href^="tel:"],a[href*="wa.me"],a[href*="api.whatsapp.com"],a[href*="whatsapp.com/send"],a[href^="mailto:"],button,a[class*="btn"],a[class*="button"],input[type=submit]';
  layout.actionsAboveFold = [...document.querySelectorAll(actionSel)]
    .filter(visible)
    .filter((el) => el.getBoundingClientRect().top < vh)
    .slice(0, 15)
    .map((el) => ({ text: text(el).slice(0, 60), href: el.getAttribute('href') || null }));
  // Tap targets: WCAG 2.5.8 minimum is 24x24 CSS px; 44 is the comfortable target.
  const taps = [...document.querySelectorAll('a[href],button,input,select,textarea,[role=button]')]
    .filter(visible)
    .map((el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), text: text(el).slice(0, 40) || el.getAttribute('aria-label') || el.tagName }; });
  layout.tapTargets = {
    total: taps.length,
    under24: taps.filter((t) => t.w < 24 || t.h < 24).length,
    under44: taps.filter((t) => t.w < 44 || t.h < 44).length,
    worst: taps.filter((t) => t.w < 24 || t.h < 24).sort((a, b) => a.w * a.h - b.w * b.h).slice(0, 5),
  };
  // Fixed/sticky elements and how much of the viewport they cover (popups, cookie bars, bubbles).
  layout.fixedElements = [...document.querySelectorAll('body *')]
    .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position) && visible(el))
    .map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName, id: el.id || null, cls: (el.className && el.className.toString().slice(0, 60)) || null, coveragePct: Math.round((Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / (vw * vh)) * 100), text: text(el).slice(0, 80) }; })
    .filter((f) => f.coveragePct > 0)
    .slice(0, 12);
  if (!firstPass) return { layout };

  // Everything below is viewport-independent, so it is captured once.
  const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content') ?? null;
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    try { return JSON.parse(s.textContent); } catch (e) { return { parseError: String(e), raw: s.textContent.slice(0, 300) }; }
  });
  const links = [...document.querySelectorAll('a[href]')].map((a) => ({
    text: text(a).slice(0, 80) || a.getAttribute('aria-label') || a.querySelector('img')?.alt || '',
    href: a.getAttribute('href'),
    abs: abs(a.getAttribute('href')),
    inNav: !!a.closest('nav,header'),
    inFooter: !!a.closest('footer'),
    target: a.getAttribute('target'),
  }));
  const forms = [...document.querySelectorAll('form')].map((f) => ({
    action: f.getAttribute('action'),
    actionAbs: f.getAttribute('action') ? abs(f.getAttribute('action')) : null,
    method: (f.getAttribute('method') || 'get').toLowerCase(),
    fields: [...f.querySelectorAll('input,select,textarea')].filter((i) => i.type !== 'hidden').map((i) => ({
      tag: i.tagName.toLowerCase(), type: i.type || null, name: i.name || null, required: i.required,
      hasLabel: !!(i.id && document.querySelector(`label[for="${CSS.escape(i.id)}"]`)) || !!i.closest('label') || !!i.getAttribute('aria-label'),
      placeholder: i.placeholder || null,
    })),
    hasCaptcha: !!f.querySelector('[class*="captcha"],[data-sitekey],iframe[src*="recaptcha"],iframe[src*="turnstile"]'),
  }));
  const iframes = [...document.querySelectorAll('iframe')].map((i) => i.src).filter(Boolean);
  const imgs = [...document.querySelectorAll('img')];
  const images = {
    total: imgs.length,
    broken: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc).slice(0, 20),
    missingAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
    oversized: imgs.filter((i) => i.naturalWidth > 0 && i.clientWidth > 0 && i.naturalWidth > 2.5 * i.clientWidth * (window.devicePixelRatio || 1)).map((i) => ({ src: i.currentSrc, natural: i.naturalWidth, rendered: i.clientWidth })).slice(0, 15),
  };
  const bodyText = text(document.body);
  // Placeholder / template leftovers that make a site look unfinished.
  const placeholderPatterns = [/lorem ipsum/i, /dolor sit amet/i, /sample page/i, /hello world/i, /coming soon/i, /pr[oó]ximamente/i, /en construcci[oó]n/i, /your (title|text|heading) here/i, /tu (t[ií]tulo|texto) aqu[ií]/i, /add your text/i, /agrega tu texto/i, /this is a paragraph/i, /esto es un p[aá]rrafo/i, /click (here )?to edit/i, /haz clic (aqu[ií] )?para editar/i, /I'?m a paragraph/i, /soy un p[aá]rrafo/i,
    // Wix / Squarespace / WordPress builder defaults in Spanish and English (seen on real client sites).
    /soy un (producto|t[ií]tulo|texto|bot[oó]n)/i, /soy la descripci[oó]n/i, /I'?m a (product|title|button)/i, /I'?m the (product )?description/i,
    /sample (product|text)/i, /producto de (ejemplo|muestra)/i, /just another wordpress site/i, /otro sitio realizado con wordpress/i];
  // The <title> is scanned too: builder defaults like "| Misitio" / "| My Site" and internal page
  // names like "MENU_TIENDA" leak into search results and browser tabs.
  const titlePatterns = [/\|\s*mi ?sitio\b/i, /\|\s*my ?site\b/i, /\b[A-Z]{3,}_[A-Z0-9_]{2,}\b/, /^(untitled|sin t[ií]tulo|home|inicio)$/i];
  const placeholders = [
    ...placeholderPatterns.map((re) => { const m = bodyText.match(re); return m ? m[0] : null; }),
    ...titlePatterns.map((re) => { const m = document.title.match(re); return m ? `title: ${m[0]}` : null; }),
  ].filter(Boolean);
  // Sections that occupy space but say nothing (empty blocks).
  const emptySections = [...document.querySelectorAll('section,main > div,[class*="section"]')]
    .filter(visible)
    .filter((el) => el.getBoundingClientRect().height > 200 && text(el).length < 20 && !el.querySelector('img,video,iframe,canvas,svg,picture'))
    .map((el) => ({ tag: el.tagName, id: el.id || null, cls: (el.className && el.className.toString().slice(0, 60)) || null, height: Math.round(el.getBoundingClientRect().height) }))
    .slice(0, 10);
  // Freshness signals: copyright years and any 4-digit years / dates mentioned in the text.
  const copyright = (bodyText.match(/(©|&copy;|copyright|derechos reservados)[^.]{0,60}/gi) || []).slice(0, 3);
  const years = [...new Set((bodyText.match(/\b(20[0-3]\d)\b/g) || []).map(Number))].sort();
  // Analytics / ad tags present in the HTML (presence only; firing is checked from network log).
  const html = document.documentElement.outerHTML;
  const tags = {
    gtm: [...new Set(html.match(/GTM-[A-Z0-9]{4,10}/g) || [])],
    ga4: [...new Set(html.match(/\bG-[A-Z0-9]{6,12}\b/g) || [])],
    googleAds: [...new Set(html.match(/\bAW-\d{6,12}\b/g) || [])],
    metaPixel: /fbq\(|connect\.facebook\.net\/[^"']*fbevents/.test(html),
    clarity: /clarity\.ms/.test(html),
    tiktokPixel: /analytics\.tiktok\.com/.test(html),
    hotjar: /static\.hotjar\.com/.test(html),
  };
  const generator = meta('generator');
  // Counts are stored separately from the text samples: the samples are capped, and a capped
  // list once made an agent report "5 H1" on a page that had 24.
  const headings = {
    h1Count: document.querySelectorAll('h1').length,
    h2Count: document.querySelectorAll('h2').length,
    h1: [...document.querySelectorAll('h1')].map(text).slice(0, 10),
    h2: [...document.querySelectorAll('h2')].map(text).slice(0, 20),
  };
  const navItems = [...document.querySelectorAll('nav a[href], header a[href]')].map((a) => text(a)).filter(Boolean);
  return {
    layout,
    url: location.href,
    lang: document.documentElement.lang || null,
    title: document.title,
    metaDescription: meta('description'),
    canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    metaRobots: meta('robots'),
    viewportMeta: meta('viewport'),
    og: { title: meta('og:title'), description: meta('og:description'), image: meta('og:image'), type: meta('og:type') },
    hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => ({ lang: l.hreflang, href: l.href })),
    jsonLd: ld,
    headings,
    navItems: [...new Set(navItems)].slice(0, 30),
    wordCount: bodyText.split(/\s+/).filter(Boolean).length,
    textSample: bodyText.slice(0, 4000),
    links,
    forms,
    iframes,
    images,
    placeholders,
    emptySections,
    copyright,
    yearsMentioned: years,
    tags,
    generator,
  };
}

const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const result = { input: url, slug, startedAt: new Date().toISOString(), viewports: {}, errors: [] };
try {
  for (const [i, vp] of viewports.entries()) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    const mixedContent = [];
    const thirdPartyHosts = new Set();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 300)}`));
    page.on('requestfailed', (r) => failedRequests.push({ url: r.url().slice(0, 300), reason: r.failure()?.errorText }));
    page.on('response', (r) => {
      const u = r.url();
      if (r.status() >= 400) failedRequests.push({ url: u.slice(0, 300), status: r.status() });
      if (u.startsWith('http://') && url.startsWith('https://')) mixedContent.push(u.slice(0, 300));
      try { thirdPartyHosts.add(new URL(u).host); } catch {}
    });
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1 });
    if (vp.mobile) await page.setUserAgent(MOBILE_UA);
    const t0 = Date.now();
    let resp = null;
    try {
      resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    } catch (e) {
      result.errors.push({ viewport: `${vp.width}x${vp.height}`, error: `goto: ${String(e).slice(0, 200)}` });
    }
    // Give lazy widgets (chat bubbles, cookie banners, popups on a timer) a moment to appear.
    await new Promise((r) => setTimeout(r, 2500));
    const data = await page.evaluate(extract, i === 0).catch((e) => ({ evalError: String(e) }));
    const key = `${vp.width}x${vp.height}`;
    if (i === 0) {
      const nav = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
        const res = performance.getEntriesByType('resource');
        return n ? {
          ttfbMs: Math.round(n.responseStart - n.requestStart),
          domContentLoadedMs: Math.round(n.domContentLoadedEventEnd),
          loadMs: Math.round(n.loadEventEnd),
          lcpMs: lcp ? Math.round(lcp.startTime) : null,
          requests: res.length,
          transferKB: Math.round(res.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
          jsKB: Math.round(res.filter((r) => r.initiatorType === 'script').reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
        } : null;
      }).catch(() => null);
      Object.assign(result, data, {
        httpStatus: resp?.status() ?? null,
        finalUrl: page.url(),
        wallClockMs: Date.now() - t0,
        timing: nav,
        consoleErrors: [...new Set(consoleErrors)].slice(0, 40),
        failedRequests: failedRequests.slice(0, 40),
        mixedContent: [...new Set(mixedContent)].slice(0, 20),
        thirdPartyHosts: [...thirdPartyHosts].sort(),
      });
      delete result.layout;
    }
    result.viewports[key] = data.layout ?? data;
    if (wantShots) {
      // Viewport-only JPEG, then downscaled to <=800px wide so an agent can Read it for ~1-2k
      // tokens instead of ~150k for a full-size full-page PNG.
      const raw = path.join(shotDir, `${slug}-${key}.raw.jpg`);
      const out = path.join(shotDir, `${slug}-${key}.jpg`);
      await page.screenshot({ path: raw, type: 'jpeg', quality: 70 });
      try {
        execFileSync('magick', [raw, '-resize', '800x800>', '-quality', '60', out]);
        fs.unlinkSync(raw);
      } catch {
        fs.renameSync(raw, out);
      }
      result.viewports[key].screenshot = path.relative(runDir, out);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
result.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(pageDir, 'probe.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, slug, file: path.join(pageDir, 'probe.json'), errors: result.errors.length }));
