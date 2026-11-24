# Running impeccable critique + audit on a third-party live URL

impeccable is an optional, separate skill, installed at `<path to the impeccable skill>`. If it is
not installed, the design lanes fall back to a plain heuristic review from the screenshots and
probe facts, and the Assessment B detector findings are simply absent (record that as `skipped`).
When installed, Load its `SKILL.md`, then `reference/critique.md` and `reference/audit.md`, and follow
them with these adaptations for a site we do not own and have no source for.

## Setup
- `export IMPECCABLE_BROWSER=$(node -e "import('<skill>/scripts/lib.mjs').then(m=>console.log(m.chromePath()))")`
  Without it, `impeccable detect` fails with "No Chrome, Chromium, Edge, or Brave installation found".
- Run impeccable commands from `<run-dir>/impeccable/` (an empty dir) so it cannot pick up our own
  repo's `PRODUCT.md` / `DESIGN.md`. Do not route into `init`.
- Mode: infer from the page (small-business home = Persuade; blog/menu/catalog = Read). Record it.

## Assessment A (design review)
Isolated sub-agent. Input: the start page URL, the downscaled screenshots in `<run-dir>/shots/`,
and the `textSample` / `headings` / `navItems` from `pages/home/probe.json`. NOT the detector
output, NOT the business profile (it would anchor the design judgment). Returns the critique.md
Assessment A shape: design-specificity verdict, 10 heuristic scores (0-4), cognitive load,
emotional journey, strengths, 3-5 priority issues.

## Assessment B (detector)
Isolated sub-agent, in parallel with A. For the start page and up to 3 nav pages:
```bash
I=<path to the impeccable skill>/scripts/impeccable
$I detect --json --no-config --no-design-system "<url>"                      > detect-<slug>-desktop.json
$I detect --json --no-config --no-design-system --viewport 360x800 "<url>"   > detect-<slug>-mobile.json
```
Exit code 2 means "findings present", not failure.
**Builder sites (Wix, Squarespace) serve a separate mobile DOM by user agent, and `detect
--viewport 360x800` does not send a mobile UA:** it scans the desktop page squeezed to 360 px and
reports huge horizontal overflow that real phones never see. For mobile layout facts trust
`pages/*/probe.json` at 360x800 (rendered with a mobile UA); mark contradicting detector rows
`partial`.
Skip the live-server overlay and `[Human]` injection: they inject scripts into someone else's
page and nobody is watching. Write in the critique header:
`Provenance: two isolated sub-agents, URL target, no source. Overlay skipped: unattended third-party URL.`
That is a complete run, not a degraded one, as long as the detector ran.

## Audit dimensions
- Theming: `n/a` (no source tokens).
- Performance: take numbers from `perf/*-summary.json`, never re-derive.
- Accessibility, Responsive, Integrity: from rendered DOM (`probe.json` viewports), Lighthouse
  failed a11y audits, and detector output.

## Closing question
critique.md requires targeted questions at the end. In this pipeline nobody answers mid-run, so
render them as the report's **"Puntos por aclarar"** section (2-4 questions, 2-3 concrete options
each, tied to findings), and add to the critique file:
`Questions skipped: unattended pipeline, rendered as client decisions in the report.`
Never call AskUserQuestion from inside the pipeline.

## Where scores go
Impeccable's /40 heuristic total and audit /20 go in the **appendix** and in `run.json`, so a
re-audit after the work can show "antes 18/40, después 31/40". They are not a headline in the
first pitch: owners remember one number and this one needs a legend.
