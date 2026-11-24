---
name: brand-name-audit
description: Use when evaluating, clearing, or stress-testing a brand name, product name, domain, or coined word — "does this name work?", "audit this name", "what does X sound like in Spanish/English?", "is this name taken/safe?". Linguistic-cultural audit covering morphology, register, live brand market, and cross-language readings — with verification rules for the research layer itself.
---

**Created by Erandi Rodríguez / [github.com/erandipiti](https://github.com/erandipiti)**

Distilled from real naming-audit sessions where the research tooling itself —
search stemming, agreeable summarizers, gated corpora — produced confident wrong
answers. The skill audits the name AND distrusts the instruments.

**Licence:** This skill is released under CC BY 4.0. You are free to share and
adapt it for any purpose, provided you give appropriate credit to the original
author.

**Feedback & Support:** If the methodology produces a bad audit (not an
execution mistake), open an issue on the author's GitHub so the skill improves.

# Brand / Name Linguistic-Cultural Audit

## Rule zero: bluntness is the deliverable

Naming audits fail in the direction of politeness. If the name reads as
something embarrassing, juvenile, or obscene in any target language, **say it
in the first paragraph, verbatim**. The user is paying for exactly the finding
tact would suppress. A veto with evidence beats a hedge every time.

## The four lenses (run all four — they veto independently)

1. **Morphology / parent lexeme.** For coinages there is no usage data, so
   morphology is the strongest evidence: what is this string *built from*, and
   what does it *have* to mean to a native reader? Check the parent word, the
   diminutive/augmentative reading, and unfortunate segmentations
   (mis-splits: check every way the string chunks). Morphology can veto a name
   that attestation research would clear.
2. **Register.** "How is this word used/written?" is underspecified until you
   fix the register — books, chat, ads, and slang can rank the same form in
   opposite directions, and both rankings are true. Name the register the
   decision rides on (usually: casual speech of the target demo) and report
   whether your evidence reaches *that* register.
3. **Live brand market.** The namespace is evidence, not just a clearance
   check: when a big enough brand occupies a similar string, *its* reading
   becomes the default regardless of what grammar predicts (a "silent H" is
   not silent if a famous brand taught everyone to pronounce it). Search app
   stores, trademarks, social handles, and the top brands in the category.
4. **Cross-language sweep.** Every target-market language: literal meaning,
   slang meaning, phonetic near-collisions when spoken aloud with each
   language's phonology.

## Distrust the instruments (verification rules)

- **Search engines stem silently, even inside quotes.** Before concluding "the
  exact token X is/isn't used", run a **calibration probe**: search a string
  whose presence/absence you already know, and confirm the engine
  distinguishes X from its stem/neighbors. Otherwise you're measuring the
  tokenizer, not the language.
- **Summarizers manufacture the yes.** Any load-bearing claim — especially a
  NEGATIVE ("no one uses this", "the pun doesn't exist") — must be verified
  against primary documents/results, never a summarizer's paraphrase.
  Fabrication concentrates on exactly the question you most want answered.
- **Gated corpora are a routing problem, not a dead end.** If the
  authoritative corpus is paywalled/WAF'd, count it yourself on an open
  dataset (subtitles, forums, Common Crawl samples) and report the confounds.
  Reserve "UNVERIFIED" for what cannot be measured, not what a tool refused
  to serve.

## Generating alternatives (only if asked)

Clearance filters make terrible generators — constraints eliminate, they don't
create. Generate from the brand's semantic core first (metaphor, feeling,
story), THEN run each candidate through the four lenses. Never generate by
mutating strings until the filters pass.

## Output

Verdict per candidate: **CLEAR / RISKY / VETO** + the single strongest reason,
then the lens-by-lens evidence (with which claims are verified vs inferred),
then the register/language matrix. State what you could NOT verify and why.

## Pre-flight check (before delivering)

Re-read: did you (1) state the embarrassing reading bluntly and first,
(2) run a calibration probe before any "X isn't used" claim, (3) name the
register for every frequency claim, (4) check the live brand market and not
just dictionaries, (5) mark unverifiable claims as such?
