---
name: prompt-deck
description: Use when the user wants to turn a prompt framework (usually an Instagram or LinkedIn carousel, or a post with several prompts containing [PLACEHOLDER] slots) into a fillable page. Triggers include "/prompt-deck <url>", "turn this carousel into a form", "make a fillable page from these prompts", "extract these prompts". Produces one self-contained HTML file where the user answers the slots in plain fields, sees the assembled prompt live, and copies or downloads it.
---

# prompt-deck: scanned prompt framework to a fillable page

A **prompt deck** is one HTML file that holds a published prompt framework. The user fills the
`[CONTEXT]` slots in fields, the page assembles the original prompt with their answers injected,
and they copy it into whatever model they like. The page never runs the prompt.

Not a prompt framework? A tool, a tip or a stat is a review job, not a deck. Say so and offer to
evaluate it instead.

## The output

One file, `<name>.html`, with inline CSS and JS, no external requests, works offline. It has:
fields per slot, live assembled prompt per prompt, copy and download buttons, a progress count,
autosave to `localStorage` (wrapped in try/catch, the page works without it), light and dark theme,
and a mobile layout. There is no limit on the number of prompts or slots.

Start from `template.html` in this folder (tested). Copy it, then replace only the `const DECK = {...}`
block. Leave the engine below it alone. `example.html` shows a finished deck with one prompt that has
slots and one that has none.

## The data model

```js
const DECK = { form, title, source, intro, prompts: [
  { n, title, chain?, lead?, head, ctx: [ { id, q, en, slot, hint? } ], tail }
] };
```

- `form`: a short slug, used for the storage key and download names.
- `head`: the prompt text up to and including the line that introduces the context. For a prompt with
  no such structure, the role sentence.
- `ctx`: one entry per slot. `id` is unique across the deck (`p1c1`, `p1c2`...). `en` is the literal
  line exported into the prompt, in the source language (the name is historical, do not translate the
  prompt body). `q` is the question shown to the user, in the user's language. `slot` is the original
  `[PLACEHOLDER]`, kept in the export when the field is empty so a half-filled export looks half-filled.
  `hint` says what makes an answer useless ("real hours, not aspirational ones").
- `tail`: everything after the data (output format and so on).
- Assembly: `head + "\n" + (en + " " + (answer || slot) per line) + "\n" + tail`.

## Steps

### 1. Scan the source

Use whatever browser tool you have. For a carousel:

- Slides lazy-load and unmount offscreen, so reading the DOM at the end returns two images, not all
  of them. Walk the carousel with Next and collect image URLs at each step.
- The real slide count is the dot indicators, not how many times Next was clickable. Check
  `dots == unique images`. If they disagree you missed a slide: walk again.
- Dedupe by the filename in the URL, because the query string changes per request.
- Signed CDN URLs usually need no cookies: `curl -s -m 30 -o s1.jpg "<url>"` is more reliable than a
  browser download, which can time out.
- Images are expensive to read. Build a contact sheet to classify slides, then read single slides at
  about 1000 px only where the text is dense.
- Also read the caption. It often names prompts the slides do not show.
- Do not assume slide count equals prompt count. Carousels pad with intro, testimonial and call-to-action
  slides.
- If the post cannot be reached (login wall, restricted account), ask for screenshots. Do not guess.

### 2. Decide the shape before writing

- **N independent prompts**: each stands alone.
- **N chained prompts**: a `[paste ...]` slot is fed by the previous prompt's output, not by the user's
  data. Set `chain` on each and make the hint say which prompt the text comes from.
- **One prompt split across slides**: the phases were paginated for the carousel. Build one prompt with
  all its slots, not one per slide.
- **A prompt with no slots**: legitimate (for example "Ask me questions to find..."). Use `ctx: []` and
  say so in `lead`. Do not invent slots to match its siblings.

### 3. Transcribe verbatim

- Bodies go verbatim, the author's typos included. If a word looks like a typo, re-read it at 2x before
  fixing it.
- Strip carousel chrome only: the `Prompt:` label, "swipe", slide numbers used as positions. A reference
  like `[FROM SLIDE 2]` becomes `[FROM PROMPT 1]`. Mention that change in a comment.
- Never invent a missing slide. If prompt 4 is absent, keep the gap in the numbering, say so in `intro`,
  and tell the user. Writing the missing prompt yourself is fabrication.
- When a label and its slot share a sentence ("Here is my list: [paste from previous prompt]"), the label
  goes in that slot's `en`, not in `head`, or the export leaves a stray space.
- Line breaks follow the sense of the text, not the width of the image.

### 4. Adapt only what would force hand-editing every time

Verbatim is the default. Adapt the following, and say what changed in `intro` with the source link:

- **Currency and units**: re-denominate to what the user uses, keeping the shape of the original.
  Do not apply an exchange rate: it invents a number and goes stale.
- **Broken machine translation**: fix mistranslations that degrade the output (a false friend that
  changes the meaning).
- **The author's own numbers standing in for the user's** (their price, their audience size): turn it
  into a slot, and note that the page adds a slot the original did not have.

Leave alone: domain terms with no clean equivalent, the prompt body's language, and ordinary phrasing
quirks. English decks stay English: the user answers in their language and the export assembles in the
source language, unless they ask to translate.

### 5. Write `q` and `hint` yourself

Those are the only original text. Keep hints short and concrete, and say what makes an answer useless.

### 6. Build, test, hand over

1. Copy `template.html` to `<name>.html` and replace the `DECK` block.
2. Open it headless or in a browser. Confirm: no console errors, typing in a field changes the assembled
   text, a reload keeps the answers, an empty slot still shows its `[PLACEHOLDER]`.
3. Show the user the assembled prompts or a screenshot and get a yes before saying it is final.
4. Tell them the full path of the file. If you have an Artifact or page-publishing tool, offer to publish
   it, and do not publish without a yes.

## Gotchas

- `ctx` ids must be unique across the whole deck, or two fields share one answer.
- Browser automation tools may only open local files inside certain folders. If a `file://` page will not
  open, copy it to an allowed folder such as `/tmp` for the test.
- Keep the page free of external fonts, scripts and images so it keeps working offline.
