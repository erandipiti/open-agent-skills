#!/usr/bin/env node
// build-report.mjs: turn report/report.src.html into the publishable report/report.html.
//
// Usage: node build-report.mjs <run-dir>
// The writer references screenshots by run-relative path (<img src="shots/home-360x800.jpg">).
// Artifacts block every external image host, so each local image is inlined as a data: URI here.
// Keeping the source with plain paths makes it editable and diffable; the built file is not.
import fs from 'node:fs';
import path from 'node:path';

const runDir = process.argv[2];
const src = path.join(runDir ?? '', 'report', 'report.src.html');
if (!runDir || !fs.existsSync(src)) { console.error(`usage: node build-report.mjs <run-dir>  (missing ${src})`); process.exit(64); }
let html = fs.readFileSync(src, 'utf8');
let inlined = 0;
html = html.replace(/src="((?:shots|social|impeccable)\/[^"]+\.(jpe?g|png|webp))"/g, (m, rel, ext) => {
  const file = path.join(runDir, rel);
  if (!fs.existsSync(file)) { console.error(`missing image ${rel}`); return m; }
  inlined++;
  const mime = ext.startsWith('jp') ? 'jpeg' : ext;
  return `src="data:image/${mime};base64,${fs.readFileSync(file).toString('base64')}"`;
});
fs.writeFileSync(path.join(runDir, 'report', 'report.html'), html);
console.log(JSON.stringify({ ok: true, inlined, bytes: Buffer.byteLength(html) }));
