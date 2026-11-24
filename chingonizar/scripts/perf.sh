#!/usr/bin/env bash
# perf.sh: lab performance with Lighthouse (pinned in package.json) on our own headless Chromium,
# plus Google field data (PageSpeed Insights / CrUX) when an API key is available.
#
# Usage: bash perf.sh <url> <run-dir> [runs=3]
# Output: <run-dir>/perf/<slug>-mobile-run<N>.json, <slug>-desktop.json, <slug>-summary.json,
#         and psi-<slug>.json when PSI_API_KEY is set (or readable via `secret PSI_API_KEY`).
#
# Why 3 mobile runs: a single Lighthouse run on a shared box varies a lot; the summary reports
# the median and the range so nobody quotes one lucky or unlucky number to a client.
# Why the key matters: keyless PSI returns 429 (shared daily quota exhausted), so without a key
# there is NO field data. The report must then say "sin datos de usuarios reales", never guess.
set -uo pipefail
URL="$1"; RUN="$2"; RUNS="${3:-3}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$RUN/perf"; mkdir -p "$OUT"
SLUG=$(node -e "import('$HERE/lib.mjs').then(m=>console.log(m.slugFor(process.argv[1])))" "$URL")
export CHROME_PATH="${CHROME_PATH:-$(node -e "import('$HERE/lib.mjs').then(m=>console.log(m.chromePath()))")}"
LH="$HERE/node_modules/.bin/lighthouse"
FLAGS=(--quiet --output=json --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo)

for i in $(seq 1 "$RUNS"); do
  timeout 180 "$LH" "$URL" "${FLAGS[@]}" --form-factor=mobile --output-path="$OUT/$SLUG-mobile-run$i.json" \
    || echo "{\"runtimeError\":{\"code\":\"TIMEOUT_OR_CRASH\"}}" >"$OUT/$SLUG-mobile-run$i.json"
done
timeout 180 "$LH" "$URL" "${FLAGS[@]}" --preset=desktop --output-path="$OUT/$SLUG-desktop.json" \
  || echo "{\"runtimeError\":{\"code\":\"TIMEOUT_OR_CRASH\"}}" >"$OUT/$SLUG-desktop.json"

# Summary: median + min/max per metric across mobile runs, plus desktop, plus top opportunities.
node - "$OUT" "$SLUG" <<'EOF'
const fs = require('fs'); const path = require('path');
const [out, slug] = process.argv.slice(2);
const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')); } catch { return null; } };
const runs = fs.readdirSync(out).filter((f) => f.startsWith(`${slug}-mobile-run`)).map(read).filter((r) => r && !r.runtimeError && r.categories);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const metric = (r, id) => r.audits[id]?.numericValue ?? null;
const ids = ['largest-contentful-paint', 'first-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'speed-index', 'server-response-time', 'total-byte-weight'];
const summary = { slug, mobileRuns: runs.length, mobile: {}, scoresMobileMedian: {}, desktop: null, opportunities: [], fieldData: null };
for (const id of ids) { const v = runs.map((r) => metric(r, id)).filter((x) => x != null); summary.mobile[id] = { median: med(v), min: Math.min(...v), max: Math.max(...v), unit: id === 'cumulative-layout-shift' ? 'unitless' : (id === 'total-byte-weight' ? 'bytes' : 'ms') }; }
for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) summary.scoresMobileMedian[c] = med(runs.map((r) => Math.round((r.categories[c]?.score ?? 0) * 100)));
const d = read(`${slug}-desktop.json`);
if (d && d.categories) summary.desktop = { performance: Math.round(d.categories.performance.score * 100), lcpMs: metric(d, 'largest-contentful-paint'), cls: metric(d, 'cumulative-layout-shift') };
if (runs[0]) {
  summary.opportunities = Object.values(runs[0].audits).filter((a) => a.details?.type === 'opportunity' && (a.details.overallSavingsMs ?? 0) > 200)
    .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs).slice(0, 8).map((a) => ({ id: a.id, title: a.title, savingsMs: Math.round(a.details.overallSavingsMs) }));
  summary.failedA11yAudits = Object.values(runs[0].audits).filter((a) => a.score === 0 && runs[0].categories.accessibility.auditRefs.some((x) => x.id === a.id)).map((a) => ({ id: a.id, title: a.title, items: a.details?.items?.length ?? null }));
}
fs.writeFileSync(path.join(out, `${slug}-summary.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ok: runs.length > 0, slug, mobileRuns: runs.length, perfMedian: summary.scoresMobileMedian.performance }));
EOF

# Field data (real Chrome users, 28-day window). Optional; needs a key.
KEY="${PSI_API_KEY:-$(command -v secret >/dev/null && secret PSI_API_KEY 2>/dev/null || true)}"
if [ -n "$KEY" ]; then
  curl -sS --max-time 120 "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$(node -e 'console.log(encodeURIComponent(process.argv[1]))' "$URL")&strategy=mobile&category=performance&key=$KEY" \
    | jq '{loadingExperience, originLoadingExperience}' >"$OUT/psi-$SLUG.json" 2>/dev/null || echo '{"error":"psi request failed"}' >"$OUT/psi-$SLUG.json"
else
  echo '{"skipped":"no PSI_API_KEY; field data unavailable (keyless quota returns 429)"}' >"$OUT/psi-$SLUG.json"
fi
