# Report contract

Section titles below are shown in Spanish as examples; translate them to the audited site's language.
The sample template in `report-template.html` is in English.

Two outputs from one ledger:
1. **Client report** `report/report.html` (+ `report/report.pdf`): language of the site (Spanish
   for MX sites), written for a non-technical owner. Published as a private Artifact; the PDF is
   for forwarding on WhatsApp.
2. **Operator appendix** `report/appendix.md`: everything technical, in the operator's language (it is for the operator only).

## findings.jsonl (the ledger)
One JSON object per line. Agents of every lane append here; the report may only state values
that exist here (`lint-report.mjs` enforces it).
```json
{"id":"perf.lcp.home.mobile","lane":"perf","page":"https://x.mx/","severity":"high",
 "title":"La página principal tarda en mostrarse en celular","display":"6.7 s",
 "raw_file":"perf/home-summary.json","raw_path":"mobile.largest-contentful-paint.median",
 "status":"ok","confidence":1.0,"evidence_note":"median of 3 Lighthouse mobile runs, range 6.1-7.4 s"}
```
- `status`: `ok` | `partial` | `blocked` | `failed` | `skipped`. Only `ok` may be stated as fact.
  `blocked` (login wall, 403) means **unknown**, never negative.
- `display`: exactly the string shown in the report next to `data-ev`.
- Ids: `<lane>.<what>.<page-slug>[.<viewport>]`, lowercase.
- `raw_file` is run-relative; a glob (`pages/*/probe.json`) is fine for site-wide counts. Findings
  from the web (search results, a competitor's site) use `source_url` instead. One of the two is
  required, or the linter fails.
- Before merging, check overlapping lanes for the same fact with different values (one lane counted
  5 Wix social links, another 6 because of `il.linkedin.com`): re-measure, keep the right one.

## Brand: your own stationery
The client report uses one stationery. The default is a neutral dark palette defined as CSS
variables at the top of `reference/report-template.html`: ink `#111418`, surface `#181c21`, text
`#eef0f2`, muted `#a3acb5`, hairlines `#2b323a`, accent `#6aa6e0` (deep `#2f6fb0` for the
contact band), Newsreader (display, italic accent emphasis) + Hanken Grotesk (body). Single dark
theme on purpose. **Start every report from `reference/report-template.html`** (a finished
sample report): keep its CSS and structure, replace the content. To brand it, the operator
changes the variables (colors, fonts) and the contact email, phone and site in the two
`<footer class="band">` blocks (cover band and closing band); footers are exempt from the number
linter. Keep the operator's private contact details out of public pages.

Print rules learned the hard way (the template already has them):
- `body { margin: 0 }`: the Artifact skeleton zeroes it at publish, but the local file printed to
  PDF keeps Chromium's 8px and pushes the cover band onto a blank second sheet.
- Fixed-height pages use `height: 296mm; box-sizing: border-box` (not 297: rounding spills a sheet).
- Only the cover, the first findings page, "Puntos por aclarar" and the closing page force a new
  sheet (`break-hard`); everything else flows with `break-inside: avoid` on each row.
- A screenshot row is two grid cells (image + `.txt` block); spanning the image across text rows
  stretches the paragraphs apart.
- Measured values are `.v` (terracotta, semibold), never monospace chips: those read as code.
- After `pdf.mjs`, look at a contact sheet of the PDF (`pdftoppm -r 40` + `magick montage`) once.

## "Puntos por aclarar" (not "decisiones")
Written for the owner to think about before the meeting: each point = a question in their words,
one line of context from the findings, and 1-2 reflective sub-questions. No multiple-choice menu,
no "elige A o B". It ends with "con eso armamos la propuesta final".

## Page mechanics (Artifact contract)
- Write `report/report.src.html` with no `<!doctype>/<html>/<head>/<body>`: start with `<title>`,
  the `claude:viewport-fit-sides` meta, Google Fonts link and `<style>` (light + dark tokens).
- Reference screenshots by run-relative path (`<img src="shots/home-360x800.jpg">`), then
  `node scripts/build-report.mjs $RUN` inlines them as data URIs into `report/report.html`.
  Use 2-3 images: the mobile home and the page with the #1 problem.
- Quoting the site's own text that contains digits ("animación en 2D"): `<q data-lint="ok">`.
- Load `artifact-design` before writing; publish with `icon` on first publish.

## Client report structure (in this order)
1. **Header**: site name, URL, date, one sentence on what the business sells (from the business profile).
2. **Lo que estás perdiendo hoy**: 3-5 findings, each = plain-language problem + evidence
   (cropped mobile screenshot or one measured value with `data-ev`) + why it costs customers.
   Broken contact/purchase paths always first.
3. **Lo que haríamos** (kicker "La propuesta"): 3 quick wins, 3 core fixes, 2 strategic investments.
   Each item: the exact element/page, the change (with drafted copy when relevant) and the time it
   takes. **No prices or cost estimates anywhere in the client report** (operator decision): the
   document should make the reader say "va, hagamos esto, ¿cuánto me sale?". Pricing lives only in
   the operator appendix ("Operator notes", see `reference/pricing-builders.md`).
4. **Cómo se ve hoy vs. propuesta**: section map table (sección actual → Mantener / Fusionar /
   Reescribir / Quitar / Agregar, with reason) and the proposed nav + homepage order. Optional
   one mobile above-the-fold concept image.
5. **Tus redes**: one row per profile: what we could see, latest observed post, verbatim counters,
   and the honest access state ("Instagram no deja ver fechas sin iniciar sesión: pendiente de
   confirmar contigo").
6. **Puntos por aclarar**: 2-4 questions with options (from impeccable's closing questions + play
   prerequisites). This is the agenda for the meeting.
7. **Qué revisamos y qué no**: pages checked vs skipped, tools that failed, what needs owner access
   (Search Console, GBP, analytics). Plain language, short.

Audience and tone: people who showed some interest but are not convinced yet. It must read as
professional and sure of itself: we know what we are doing and we can make it better. Name the
methods on the cover (celular, tablet y computadora · velocidad · ligas · Google · seguridad · redes),
state findings plainly with evidence, propose concretely, and close with the quote invitation in
the final band ("¿Cuánto sale? Depende de qué bloques quieras hacer. Escríbeme y te mando una
cotización por bloque."). Register: tú for a single owner, ustedes for a business with a team.

Rules: no prices or cost estimates; no revenue or traffic projections; no weighted overall score; no jargon without a
half-sentence explanation (LCP → "tiempo en que aparece lo principal"); every number wrapped in
`data-ev`; Mexican Spanish, usted/tú per the site's own register (default tú); no em dashes.

## Operator appendix
Per-lane detail: full link inventory summary, Lighthouse medians/ranges + opportunities, failed a11y
audits, detector findings, impeccable critique (scores /40, audit /20), hygiene (TLS, DNS, SPF/DMARC,
headers grade, domain dates, Wayback last change), crawl coverage, tool failures from
`failures.txt`, and the full ranked backlog with impeccable command routing per item
(`adapt`, `clarify`, `layout`, `harden`, `typeset`, `polish` last) so the plan is also the work queue.
