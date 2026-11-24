#!/usr/bin/env bash
# collect.sh: Phase 1 of chingonizar. Runs every deterministic collector for one site and writes
# all raw evidence under one run directory. No judgment happens here; agents read these files.
#
# Usage: bash collect.sh <url> [run-root=~/chingonizar-runs] [--max=25] [--perf-pages=3]
# Prints the run directory on the last line.
#
# Order matters only where a step reads another's output:
#   crawl -> probe (needs selected.json) -> links + social (need probe/inventory)
#   hygiene and perf only need the URL, so they run in the background alongside.
set -uo pipefail
URL="$1"; ROOT="${2:-$HOME/chingonizar-runs}"; shift $(( $# >= 2 ? 2 : 1 ))
MAX=25; PERF_PAGES=3
for f in "$@"; do case "$f" in --max=*) MAX="${f#*=}";; --perf-pages=*) PERF_PAGES="${f#*=}";; esac; done
HERE="$(cd "$(dirname "$0")" && pwd)"
DOMAIN=$(printf '%s' "$URL" | sed -E 's#^https?://##; s#/.*$##; s#^www\.##')
RUN="$ROOT/$DOMAIN/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$RUN"
LOG="$RUN/run.log"
[ -d "$HERE/node_modules" ] || (cd "$HERE" && npm ci --no-audit --no-fund >>"$LOG" 2>&1)

step() { # step <name> <cmd...>: log start/end + exit code to run.log, never abort the run
  local name="$1"; shift
  echo "[$(date -u +%T)] START $name" >>"$LOG"
  "$@" >>"$LOG" 2>&1; local rc=$?
  echo "[$(date -u +%T)] END $name rc=$rc" >>"$LOG"
  return 0
}

cat >"$RUN/run.json" <<EOF
{"input":"$URL","domain":"$DOMAIN","startedAt":"$(date -u +%FT%TZ)","maxPages":$MAX,"perfPages":$PERF_PAGES,
 "tools":{"node":"$(node -v)","lighthouse":"$(jq -r .version "$HERE/node_modules/lighthouse/package.json")","puppeteer-core":"$(jq -r .version "$HERE/node_modules/puppeteer-core/package.json")"}}
EOF

step hygiene bash "$HERE/hygiene.sh" "$URL" "$RUN" &
HYG=$!
step crawl node "$HERE/crawl.mjs" "$URL" "$RUN" --max="$MAX"

# Probe selected pages, 4 at a time (each launches its own browser). Screenshots only for the
# start page and nav pages: the rest are sampled templates where DOM facts are enough.
jq -r '.[] | "\(.url)\t\(.why)"' "$RUN/crawl/selected.json" 2>/dev/null >"$RUN/crawl/.queue" || echo -e "$URL\tstart" >"$RUN/crawl/.queue"
while IFS=$'\t' read -r u why; do
  shots=""; [ "$why" != "sample" ] && shots="--shots"
  step "probe $u" node "$HERE/probe.mjs" "$u" "$RUN" $shots &
  while [ "$(jobs -rp | wc -l)" -gt 4 ]; do wait -n; done
done <"$RUN/crawl/.queue"
wait $(jobs -rp | grep -v "^$HYG$") 2>/dev/null

step links node "$HERE/links.mjs" "$RUN"
step social node "$HERE/social.mjs" "$RUN" &
SOC=$!

# Lighthouse on the start page + the first nav pages (the likely conversion pages). Sequential:
# parallel Lighthouse runs on one box distort each other's timings.
head -n "$PERF_PAGES" "$RUN/crawl/.queue" | cut -f1 | while read -r u; do step "perf $u" bash "$HERE/perf.sh" "$u" "$RUN" 3; done

wait $SOC $HYG 2>/dev/null
jq --arg t "$(date -u +%FT%TZ)" '. + {finishedAt: $t}' "$RUN/run.json" >"$RUN/run.json.tmp" && mv "$RUN/run.json.tmp" "$RUN/run.json"
grep -E "END .* rc=[^0]" "$LOG" >"$RUN/failures.txt" || true
echo "$RUN"
