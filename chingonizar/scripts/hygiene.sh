#!/usr/bin/env bash
# hygiene.sh: site-level checks that need no browser: headers, TLS, DNS/email auth, domain age,
# archive history, soft-404 behavior, AI-crawler rules, llms.txt, security-header grade.
#
# Usage: bash hygiene.sh <url> <run-dir>
# Output: <run-dir>/hygiene/*.{txt,json}. Each check writes its raw output; a failed check writes
# a file starting with "FAILED:" so the report can say "could not check" instead of skipping it.
set -uo pipefail
URL="$1"; RUN="$2"
OUT="$RUN/hygiene"; mkdir -p "$OUT"
HOST=$(printf '%s' "$URL" | sed -E 's#^https?://##; s#/.*$##')
APEX=${HOST#www.}
ORIGIN=$(printf '%s' "$URL" | sed -E 's#^(https?://[^/]+).*#\1#')
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

run() { # run <outfile> <cmd...>: capture output, or a FAILED marker with the exit code
  local f="$1"; shift
  if ! "$@" >"$OUT/$f" 2>&1; then echo "FAILED: exit $? running: $*" >>"$OUT/$f"; fi
}

# Response headers for the whole redirect chain (http -> https -> www hops show up here).
run headers.txt curl -sSIL -A "$UA" --max-time 20 "http://$APEX/"
run headers-final.txt curl -sSI -A "$UA" --max-time 20 "$URL"

# TLS certificate issuer and expiry.
run tls.txt bash -c "echo | timeout 15 openssl s_client -servername '$HOST' -connect '$HOST:443' 2>/dev/null | openssl x509 -noout -issuer -subject -dates"

# DNS: mail and email authentication. Missing SPF/DMARC means their email lands in spam.
{
  echo "## NS";    dig +short NS "$APEX"
  echo "## A";     dig +short A "$HOST"
  echo "## MX";    dig +short MX "$APEX"
  echo "## TXT";   dig +short TXT "$APEX"
  echo "## DMARC"; dig +short TXT "_dmarc.$APEX"
} >"$OUT/dns.txt" 2>&1

# Domain registration: RDAP first; .mx (and some ccTLDs) are not in RDAP, so fall back to whois.
if curl -sfL --max-time 20 "https://rdap.org/domain/$APEX" -o "$OUT/rdap.json"; then
  jq '{events: .events, status: .status}' "$OUT/rdap.json" >"$OUT/domain.json" 2>/dev/null || true
else
  rm -f "$OUT/rdap.json"
  run whois.txt timeout 20 whois "$APEX"
fi

# Archive history: the last 8 distinct content snapshots. A digest change = content changed.
run wayback.json curl -sS --max-time 30 "https://web.archive.org/cdx/search/cdx?url=$APEX&output=json&fl=timestamp,digest,statuscode&collapse=digest&limit=-8"

# Soft-404: a made-up URL must return 404. A 200 means broken pages look "fine" to Google.
RAND="zz-no-existe-$RANDOM$RANDOM"
printf '%s\n' "$(curl -s -o /dev/null -A "$UA" -w '%{http_code} %{url_effective}' -L --max-time 20 "$ORIGIN/$RAND")" >"$OUT/soft404.txt"

# robots.txt rules for AI crawlers, and llms.txt presence.
curl -s -A "$UA" --max-time 20 "$ORIGIN/robots.txt" | grep -iEA2 'GPTBot|ClaudeBot|anthropic|PerplexityBot|Google-Extended|CCBot|^user-agent: \*' >"$OUT/robots-ai.txt" 2>/dev/null || echo "no AI-specific rules" >"$OUT/robots-ai.txt"
printf '%s\n' "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" --max-time 15 "$ORIGIN/llms.txt")" >"$OUT/llms-txt-status.txt"

# Security headers grade from MDN HTTP Observatory (one POST, returns grade + score).
run observatory.json curl -sS -X POST --max-time 60 "https://observatory-api.mdn.mozilla.net/api/v2/scan?host=$HOST"

# Platform and plan signals for the operator's quoting sheet (reference/pricing-builders.md).
# Wix pages embed premium flags in their bootstrap JSON; other builders leave a generator meta or
# CDN hostnames. Presence of a flag is evidence; absence proves nothing.
curl -sL -A "$UA" --max-time 30 "$URL" -o "$OUT/home.html" || true
{
  printf '{"generator":%s,' "$(grep -oiE '<meta[^>]+name="generator"[^>]+content="[^"]*"' "$OUT/home.html" | head -1 | sed -E 's/.*content="([^"]*)".*/\1/' | jq -Rs 'rtrimstr("\n")')"
  printf '"wix":{"isPremium":%s,"isPremiumDomain":%s,"freemiumBanner":%s,"coBrandingBanner":%s,' \
    "$(grep -oE '"isPremium":(true|false)' "$OUT/home.html" | head -1 | cut -d: -f2 || true)" \
    "$(grep -oE '"isPremiumDomain":(true|false)' "$OUT/home.html" | head -1 | cut -d: -f2 || true)" \
    "$(grep -oE '"freemiumBanner":(true|false)' "$OUT/home.html" | head -1 | cut -d: -f2 || true)" \
    "$(grep -oE '"coBrandingBanner":(true|false)' "$OUT/home.html" | head -1 | cut -d: -f2 || true)"
  printf '"appsSeen":%s},' "$(grep -oiE 'wix-?(stores|ecom|ecommerce|bookings|restaurants|pricing-plans|members|events|blog|forms|chat)' "$OUT/home.html" | tr 'A-Z' 'a-z' | sort -u | jq -Rsc 'split("\n")|map(select(length>0))')"
  printf '"cdnHints":%s}\n' "$(grep -oiE 'static\.wixstatic\.com|squarespace-cdn\.com|cdn\.shopify\.com|mitiendanube|wp-content|hostingersite|godaddysites' "$OUT/home.html" | tr 'A-Z' 'a-z' | sort -u | jq -Rsc 'split("\n")|map(select(length>0))')"
} | sed -E 's/:,/:null,/g; s/:\}/:null}/g' > "$OUT/platform.json"
jq . "$OUT/platform.json" >/dev/null 2>&1 || echo '{"error":"platform detection produced invalid JSON"}' > "$OUT/platform.json"
rm -f "$OUT/home.html"

echo "{\"ok\":true,\"dir\":\"$OUT\"}"
