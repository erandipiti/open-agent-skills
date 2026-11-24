#!/usr/bin/env node
// lint-report.mjs: refuse to ship a report that states a number nobody measured.
//
// Usage: node lint-report.mjs <run-dir>   (checks <run-dir>/report/report.html)
// Exit 0 = clean; exit 1 = violations listed on stdout.
//
// Contract the report writer follows:
//   - Every measured value is wrapped:  <span data-ev="perf.lcp.home">6.7 s</span>
//   - "perf.lcp.home" is the `id` of a row in <run-dir>/findings.jsonl whose `display` field is
//     exactly the text shown ("6.7 s"). That row also carries `raw_file` pointing at evidence.
//   - Any other digit in visible text is a violation, except inside <code>, <time>, <ol> list
//     numbering, elements marked data-lint="ok" (prices quoted as estimates, step labels), and
//     the <footer>.
// Why: the classic failure of automated audits is a confident, invented number ("tu sitio tarda
// 8 segundos", "publicas 3 veces por semana") that the client then repeats. This makes that
// mechanically impossible to publish.

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { chromePath } from './lib.mjs';

const runDir = process.argv[2];
const reportFile = path.resolve(runDir ?? '', 'report', 'report.html');
if (!runDir || !fs.existsSync(reportFile)) { console.error(`usage: node lint-report.mjs <run-dir>  (missing ${reportFile})`); process.exit(64); }

const findings = new Map();
const flines = fs.existsSync(path.join(runDir, 'findings.jsonl')) ? fs.readFileSync(path.join(runDir, 'findings.jsonl'), 'utf8').split('\n').filter(Boolean) : [];
const problems = [];
for (const [i, line] of flines.entries()) {
  try {
    const f = JSON.parse(line);
    if (!f.id) problems.push(`findings.jsonl line ${i + 1}: missing id`);
    else findings.set(f.id, f);
    // raw_file may be a glob (pages/*/probe.json) for site-wide counts; it must match something.
    // Web-sourced findings (search results, a competitor's site) carry source_url instead.
    if (f.raw_file) {
      const exists = f.raw_file.includes('*')
        ? fs.globSync(f.raw_file, { cwd: runDir }).length > 0
        : fs.existsSync(path.join(runDir, f.raw_file));
      if (!exists) problems.push(`finding ${f.id}: raw_file ${f.raw_file} does not exist`);
    } else if (!f.source_url) problems.push(`finding ${f.id}: needs raw_file or source_url`);
  } catch { problems.push(`findings.jsonl line ${i + 1}: invalid JSON`); }
}

const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
let scan;
try {
  const page = await browser.newPage();
  await page.goto(`file://${reportFile}`, { waitUntil: 'load' });
  scan = await page.evaluate(() => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const evs = [...document.querySelectorAll('[data-ev]')].map((e) => ({ id: e.dataset.ev, text: norm(e.textContent) }));
    // Remove everything that is allowed to contain digits, then read what is left.
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('[data-ev],code,pre,time,footer,[data-lint="ok"],script,style,svg').forEach((e) => e.remove());
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const bad = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = norm(n.textContent);
      if (/\d/.test(t)) bad.push(t.slice(0, 120));
    }
    return { evs, bad };
  });
} finally { await browser.close(); }

for (const ev of scan.evs) {
  const f = findings.get(ev.id);
  if (!f) { problems.push(`data-ev="${ev.id}" has no row in findings.jsonl`); continue; }
  if (f.display != null && String(f.display).replace(/\s+/g, ' ').trim() !== ev.text) problems.push(`data-ev="${ev.id}" shows "${ev.text}" but findings.jsonl display is "${f.display}"`);
  if (f.status && f.status !== 'ok') problems.push(`data-ev="${ev.id}" cites a finding with status "${f.status}" (only ok findings may be stated as fact)`);
}
for (const t of scan.bad) problems.push(`unbacked number in text: "${t}"`);

if (problems.length) { console.log(problems.map((p) => `- ${p}`).join('\n')); console.log(`\nFAIL: ${problems.length} problem(s)`); process.exit(1); }
console.log(`OK: ${scan.evs.length} cited values, ${findings.size} findings, no unbacked numbers`);
