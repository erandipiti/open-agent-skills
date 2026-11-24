# chingonizar

Website and social audit from a single URL. It produces a client-facing report (HTML, optionally
published as an Artifact, plus a PDF) and an operator appendix, where every number in the client
report is backed by a stored measurement.

`SKILL.md` is the procedure an agent follows. This file explains how it is wired.

## Layout
```
SKILL.md                       procedure: collect -> 5 analysis lanes -> synthesis -> report
reference/plays.md             recommendation plays with observable triggers + ranking formula
reference/report.md            ledger format (findings.jsonl), page mechanics, report structure
reference/report-template.html neutral sample report to copy and brand
reference/impeccable-on-url.md optional: running the impeccable design skill on a site you do not own
reference/pricing-builders.md  optional dated reference of website-builder prices (Mexico)
scripts/                       deterministic collectors (node 24, ESM) + package.json (pinned)
  collect.sh     runs everything below for one URL; prints the run dir
  crawl.mjs      robots + sitemaps + rendered links -> selected pages (25 max, 3 per template)
  probe.mjs      renders a page at 360 (mobile UA) / 768 / 1366; DOM facts, errors, shots
  links.mjs      unique link destinations, status + redirect hops, tel/wa.me format
  social.mjs     public no-login evidence per profile; IG dates decoded from post shortcodes
  hygiene.sh     headers, TLS, DNS/SPF/DMARC, RDAP/whois, Wayback, soft-404, Observatory grade
  perf.sh        Lighthouse x3 mobile (median+range) + desktop; PSI field data if PSI_API_KEY
  build-report.mjs  inlines screenshots into report.html
  lint-report.mjs   fails on any number in the report not backed by findings.jsonl
  pdf.mjs        prints report.html to A4 PDF
```
Runs land in `~/chingonizar-runs/<domain>/<UTC timestamp>/` (outside any repo: client data).

## Requirements
- Node 24. Then `cd scripts && npm ci` (lighthouse and puppeteer-core, versions pinned).
  `collect.sh` runs it if `node_modules` is missing.
- A Chromium binary. Set `CHROME_PATH` to it, or install one with `npx playwright install chromium`.
  `lib.mjs chromePath()` uses `CHROME_PATH` first, then the newest Chromium in
  `~/.cache/ms-playwright/` (Linux layout), and throws if neither exists.
- CLI tools: curl, jq, dig, whois, openssl, magick (ImageMagick).
- Optional `PSI_API_KEY` in the environment for real-user field data. Keyless PageSpeed Insights
  usually answers 429 (shared quota), so without it the report says there is no real-user data.
- Optional: the separate `impeccable` design skill (see `reference/impeccable-on-url.md`).
  Without it the design lanes use a plain heuristic review.

## Usage
Ask the agent to audit a URL ("audit this site <url>"). The procedure runs unattended from the URL.
To brand the report, edit the CSS variables and the footer contact bands in
`reference/report-template.html` (see `reference/report.md`).

## Gotchas
- Builder sites (Wix, Squarespace) serve a different mobile DOM by user agent. probe.mjs sends a
  mobile UA at 360; `impeccable detect --viewport` does not, so its mobile overflow is a false positive.
- Builder demo social bars link to the builder's own accounts; social.mjs labels them `builder_default_link`.
- Social 403/429/999 = blocked, never broken; login wall = unknown, never inactive.
- Fixed-element coverage on Wix reports 100% (container boxes); confirm against a screenshot.
- Subagents sometimes may not write files named like reports; lanes write `lanes/<lane>.{jsonl,md}`.
- Never submit forms, log in, or bypass CAPTCHAs on a site you do not own.
