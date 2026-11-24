---
name: chingonizar
description: Use when the user hands over a website URL to audit, critique, improve or redesign ("chingonízame esta página", "/chingonizar <url>", "analiza este sitio", "qué le falta a esta web", "audit this site"), typically a small or local business site, including its linked social profiles, to produce an evidence-backed improvement plan or pitch for the owner.
---

# Chingonizar: URL in, evidence-backed improvement plan out

**Core principle:** scripts collect facts, agents judge them, and the report may only state numbers
that exist in the evidence ledger. Unknown is never reported as bad.

The client report is written in the audited site's language. The evidence-rules table below keeps
its Spanish example strings as samples; the report language follows the site, not the examples.

`SKILL_DIR` is wherever this skill is installed (for example `~/.claude/skills/chingonizar`). Everything below runs unattended from just the URL.
Do not ask the operator questions mid-run; open questions go into the report.

## Phase 1: Collect (deterministic, ~3-6 min)

```bash
RUN=$(bash $SKILL_DIR/scripts/collect.sh "<url>" | tail -1)    # flags: --max=25 --perf-pages=3
```
Writes `$RUN/{run.json,run.log,failures.txt,crawl/,pages/<slug>/probe.json,shots/,links/,social/,perf/,hygiene/}`.
Read `failures.txt` first. A failed step becomes `status:"failed"` findings, never silence.
Never submit forms, log in, click buy, or solve CAPTCHAs on a client's live site.

## Phase 2: Analyze (5 sub-agents in parallel, one message)

Each lane writes `$RUN/lanes/<lane>.jsonl` in the ledger format of `reference/report.md` plus a
short `$RUN/lanes/<lane>.md`. Pass each agent the run dir, its file list, and the ledger format.

| Lane | Reads | Does |
|---|---|---|
| `design-a` | shots/, pages/home/probe.json (text, headings, nav) | impeccable critique **Assessment A**, isolated. See `reference/impeccable-on-url.md` |
| `design-b` | URL + 3 nav pages | impeccable `detect` desktop + 360 mobile, then impeccable `audit` using perf/ and probe viewports |
| `tech` | pages/*/probe.json, links/, perf/, hygiene/, crawl/ | speed (median + range, mobile headline), broken/redirecting links, tel/wa.me format, console errors, failed requests, mixed content, forms (action, fields, labels, captcha), placeholders and template leftovers, empty sections, thin pages, SEO (title, meta, h1, canonical, JSON-LD, OG), tracking tags, TLS, SPF/DMARC/MX, soft-404, domain dates, Wayback last change, responsive facts per viewport (overflow, tap targets, CTA above fold, fixed elements coverage) |
| `business` | probe text samples, links/inventory.json, social/profiles.json | business profile (what they sell, to whom, where, primary conversion path, trust signals, freshness); WebSearch for Google Business Profile, unlinked social profiles and 2-3 local competitors; run `social.mjs $RUN <extra urls>` for newly found profiles; social interpretation; **site vs socials offer diff** (products/services announced on socials but missing on the site); **cross-page contradictions** (prices, phones, hours, addresses that differ between pages or vs schema); content trapped in images (menu, hours, prices only as pictures); typos via copy-editing; fire plays from `reference/plays.md`; section map + proposed nav |
| `growth` | lanes are independent, so give it probe text samples of home + contact page and social/profiles.json | load and apply marketing skills: `marketing-skills:cro` (home + main conversion page), `marketing-skills:copywriting` (hero headline + CTA rewrite, site language), `marketing-skills:schema` (LocalBusiness/Organization JSON-LD draft), `marketing-skills:social`. Separate lane because the business lane runs out of context before loading skills. Skip marketing-council, ads, emails, sms unless the client runs them |

## Phase 3: Synthesize (you, the main agent)

1. Merge `lanes/*.jsonl` into `$RUN/findings.jsonl`; dedupe overlapping findings (keep the best evidence).
   **Verify contested findings yourself** before they reach the report: when two lanes disagree
   (dead link vs in-page anchor, H1 count, overflow seen once), re-measure with `probe.mjs` or
   `$B js` and keep only the reproduced result. Sub-agents misread builder DOMs often.
2. Fire plays from `reference/plays.md` only on observed triggers; unobservable → "Condicional".
3. Rank with Impact x Confidence / Effort; broken contact/purchase path is always #1.
4. Build the section map (Mantener / Fusionar / Reescribir / Quitar / Agregar) and proposed nav.
5. Turn impeccable's closing questions + play prerequisites into "Puntos por aclarar".
6. Optional **Operator notes** at the top of `report/appendix.md` (operator only, never in the client
   report): platform and plan detected from `hygiene/platform.json` plus the features observed,
   what that plan costs per year from `reference/pricing-builders.md` (dated and sourced; refresh it
   when its "seen" date is over about 3 months old), and the email provider from DNS. Skip this step
   if the operator does not quote work.

## Phase 4: Report

1. Load `artifact-design`. Write `$RUN/report/report.src.html` per `reference/report.md`, every
   measured value as `<span data-ev="<finding id>">` with the finding's exact `display` text, then
   `node $SKILL_DIR/scripts/build-report.mjs $RUN` (inlines screenshots into `report.html`).
2. `node $SKILL_DIR/scripts/lint-report.mjs $RUN` until it prints OK. Never publish a failing report.
3. `node $SKILL_DIR/scripts/pdf.mjs $RUN`, write `report/appendix.md`.
4. Publish report.html as a private Artifact; give the operator the link, the PDF path, and
   the list of things only they can supply (IG/FB/GBP screenshots, analytics access) to resolve
   "Condicional" items.

## Evidence rules (each one exists because an audit got it wrong)

| Temptation | Rule |
|---|---|
| "Tu sitio tarda 8 s" from one run or memory | Median of 3 Lighthouse mobile runs, with range; local lab ≠ real users. No field data without PSI key: say so |
| "Instagram inactivo" because it hit a login wall | `login_wall` / `blocked` = unknown. Report "última publicación observada", never "última publicación" |
| "Publica todos los días" from 3 visible posts | Cadence only from a complete dated window; otherwise "N publicaciones observadas entre X y Y" |
| Facebook/IG link 403 → "liga rota" | Social 403/429/999 = `blocked_by_platform`, not broken |
| "Hay que poner tienda en línea" because it's a common idea | Play fires only on its trigger; quote the finding ids |
| Copyright 2021 → "sitio abandonado" | Freshness = copyright + newest dated content + sitemap lastmod + Wayback digest change + social. One signal alone proves nothing |
| Screenshot looks fine → "se ve bien en celular" | Responsive claims come from probe facts per viewport (overflow, tap targets, CTA above fold), screenshots are for judgment and illustration |
| Wix/Squarespace look fine at 360 px in a desktop browser | Builders serve a separate mobile DOM by user agent: probe.mjs uses a mobile UA at 360. Never judge mobile from a resized desktop page |
| "La portada tiene 5 H1" from a capped sample list | Counts come from count fields (`headings.h1Count`), never from the length of a truncated sample array |
| Read 8 full-size PNGs | Use the ≤800 px JPEGs from shots/; max 8 images in any one context |

## Quick reference

- Re-audit after the work: run again, compare `findings.jsonl` and impeccable scores (antes/después).
- Big catalog: `--max=40`; samples max 3 pages per URL template anyway.
- PSI field data: export `PSI_API_KEY` in the environment (optional); `perf.sh` picks it up.
- Optional pitch concept: after the report, `impeccable shape` + one `design-shotgun` variant of the
  mobile above-the-fold, built only from the site's real content and photos. Off by default (cost).
