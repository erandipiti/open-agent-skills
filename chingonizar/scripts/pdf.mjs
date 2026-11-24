#!/usr/bin/env node
// pdf.mjs: print report/report.html to report/report.pdf (A4, backgrounds on) with our Chromium,
// so the owner gets a file they can forward on WhatsApp.
// Usage: node pdf.mjs <run-dir>
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { chromePath } from './lib.mjs';

const runDir = process.argv[2];
if (!runDir) { console.error('usage: node pdf.mjs <run-dir>'); process.exit(64); }
const html = path.resolve(runDir, 'report', 'report.html');
const out = path.resolve(runDir, 'report', 'report.pdf');
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  // Light preference for themed reports; a single-theme brand report (dark stationery) ignores it.
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(`file://${html}`, { waitUntil: 'networkidle0', timeout: 60000 });
  // Wait for web fonts: printing before they load silently falls back to Georgia/system fonts.
  await page.evaluate(() => document.fonts.ready);
  // The report's own @page rule (A4, margin 0) wins, so full-bleed dark pages and the brand band
  // reach the paper edge instead of sitting inside white margins.
  await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
} finally { await browser.close(); }
console.log(JSON.stringify({ ok: true, pdf: out }));
