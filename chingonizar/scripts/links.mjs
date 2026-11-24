#!/usr/bin/env node
// links.mjs: check every unique link destination found by probe.mjs, once each.
//
// Usage: node links.mjs <run-dir>
// Reads:  <run-dir>/pages/*/probe.json
// Writes: <run-dir>/links/inventory.json  (every link occurrence, classified, with its page)
//         <run-dir>/links/status.json     (one row per unique destination: status + redirect hops)
//
// Requests go out WITHOUT cookies (plain fetch, not the user's browser), so checking a client's
// site never acts as a logged-in user. Social networks answer bots with 403/429/999: those are
// recorded as "blocked_by_platform", never as broken, because an inaccessible profile is not a
// dead one.

import fs from 'node:fs';
import path from 'node:path';
import { socialPlatform } from './lib.mjs';

const runDir = process.argv[2];
if (!runDir) { console.error('usage: node links.mjs <run-dir>'); process.exit(64); }
const pagesDir = path.join(runDir, 'pages');
const outDir = path.join(runDir, 'links');
fs.mkdirSync(outDir, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const probes = fs.readdirSync(pagesDir)
  .map((d) => path.join(pagesDir, d, 'probe.json')).filter((f) => fs.existsSync(f))
  .map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const siteHost = new URL(probes[0]?.finalUrl ?? probes[0]?.input).host.replace(/^www\./, '');

const classify = (href, abs) => {
  if (!href || href === '#' || /^javascript:/i.test(href)) return 'empty-or-js';
  if (href.startsWith('#')) return 'anchor';
  if (/^tel:/i.test(href)) return 'tel';
  if (/^mailto:/i.test(href)) return 'mailto';
  const sp = socialPlatform(abs);
  if (sp === 'whatsapp') return 'whatsapp';
  if (sp) return 'social';
  try { return new URL(abs).host.replace(/^www\./, '') === siteHost ? 'internal' : 'external'; } catch { return 'invalid'; }
};
// Mexican numbers: 52 + 10 digits (older wa.me links use 521 + 10). Anything else is flagged.
const phoneCheck = (raw) => {
  const digits = (raw || '').replace(/\D/g, '');
  return { digits, e164MX: /^52(1)?\d{10}$/.test(digits), tenDigitLocal: /^\d{10}$/.test(digits) };
};

const inventory = [];
for (const p of probes) {
  for (const l of p.links ?? []) {
    const type = classify(l.href, l.abs);
    const row = { page: p.finalUrl ?? p.input, text: l.text, href: l.href, abs: l.abs, type, inNav: l.inNav, inFooter: l.inFooter };
    if (type === 'tel') row.phone = phoneCheck(l.href.slice(4));
    if (type === 'whatsapp') {
      const u = new URL(l.abs);
      row.phone = phoneCheck(u.pathname.replace(/\D/g, '') || u.searchParams.get('phone'));
      row.prefilledText = u.searchParams.get('text');
    }
    if (type === 'mailto') row.emailDomain = l.href.slice(7).split('?')[0].split('@')[1]?.toLowerCase() ?? null;
    if (type === 'social') row.platform = socialPlatform(l.abs);
    inventory.push(row);
  }
  for (const f of p.forms ?? []) if (f.actionAbs) inventory.push({ page: p.finalUrl ?? p.input, type: 'form-action', abs: f.actionAbs, href: f.action });
  for (const src of p.iframes ?? []) inventory.push({ page: p.finalUrl ?? p.input, type: 'iframe', abs: src, href: src });
}
fs.writeFileSync(path.join(outDir, 'inventory.json'), JSON.stringify(inventory, null, 2));

// Follow redirects by hand so every hop is recorded (http->https->www double hops are a finding).
async function check(u) {
  const hops = [];
  let cur = u;
  for (let i = 0; i < 10; i++) {
    let r;
    try {
      r = await fetch(cur, { method: 'HEAD', redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if ([403, 405, 501].includes(r.status)) r = await fetch(cur, { method: 'GET', redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
    } catch (e) {
      return { url: u, finalStatus: 0, error: String(e.cause?.code ?? e).slice(0, 120), hops };
    }
    hops.push({ url: cur, status: r.status });
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).href; continue; }
    return { url: u, finalUrl: cur, finalStatus: r.status, hops };
  }
  return { url: u, finalUrl: cur, finalStatus: -1, error: 'too many redirects', hops };
}

const targets = [...new Set(inventory.filter((r) => ['internal', 'external', 'social', 'whatsapp', 'form-action', 'iframe'].includes(r.type)).map((r) => r.abs.split('#')[0]))];
const results = [];
const CONCURRENCY = 6;
for (let i = 0; i < targets.length; i += CONCURRENCY) {
  results.push(...await Promise.all(targets.slice(i, i + CONCURRENCY).map(check)));
}
for (const r of results) {
  const isSocial = !!socialPlatform(r.url);
  if (r.finalStatus >= 200 && r.finalStatus < 400) r.verdict = 'ok';
  else if (isSocial && [0, 400, 401, 403, 429, 999].includes(r.finalStatus)) r.verdict = 'blocked_by_platform';
  else if ([401, 403, 429].includes(r.finalStatus)) r.verdict = 'blocked_or_auth';
  else r.verdict = 'broken';
  r.redirects = r.hops.length - 1;
}
fs.writeFileSync(path.join(outDir, 'status.json'), JSON.stringify(results, null, 2));
const by = (k) => results.filter((r) => r.verdict === k).length;
console.log(JSON.stringify({ ok: true, occurrences: inventory.length, unique: results.length, broken: by('broken'), blocked: by('blocked_by_platform') + by('blocked_or_auth') }));
