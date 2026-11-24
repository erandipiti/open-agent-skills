---
name: finding-note
description: Use when the user shares something they found that sounded interesting (a post, an Instagram carousel, a repo, an article, a tool, a tip, a stat or a workflow) and wants to know if it is worth their time. Triggers include "/finding-note <url>", "evaluate this", "is this worth it", "does this help me", "look into this". Produces an evaluated note with a verdict tied to the user's own goals, not a summary of the post.
---

# finding-note: an interesting thing in, an evaluated verdict out

The output is a verdict the user can act on, not a recap. Classify the thing, verify its claims
separately from what the post says, check what the user already has, try it if that is cheap and safe,
and judge it against the user's own goals.

## Steps

### 1. Scan

- Web pages and articles: read the page. Repos: check stars, license and last push, then a shallow clone
  into a throwaway folder.
- Carousels: walk the slides with Next, count the dot indicators, dedupe images by filename, fetch signed
  CDN URLs with `curl` (browser downloads can time out), and read the caption. Images are expensive: build
  a contact sheet first, then read single slides only where the text is dense.
- If the source is unreachable (login wall, restricted account), ask for screenshots. Do not guess.

### 2. Classify, and say what it really is

Name the shape in one line: a **tool** (herramienta), a piece of **knowledge** (conocimiento: a fact,
stat or tip) or a **process** (proceso). Many posts are lead magnets ("comment X and I will send the
guide"). Say so, and say what is missing from the post because of it.

If it is a fillable prompt framework, say so and offer to turn it into a form instead (see `prompt-deck`).

### 3. Verify before judging

- Separate the post's claims from verified facts. Check numbers, benchmarks and attributions at the
  source (repo, docs, primary study). What you cannot verify is labeled "says the post", never repeated
  as fact.
- **Tool**: check whether the user already has it or something that covers it (installed packages, skills,
  plugins, services they use). If it is cheap and safe, actually try it in a throwaway place (a temporary
  folder or container), never on their live setup. A real run beats a reading of the README.
- **Knowledge**: find the primary source if the post cites one. If you cannot, say so.
- **Process**: list the steps and say what it would replace in how they work today.
- Record the date and versions of anything you checked.

### 4. Judge fit against the user's own goals

Tie the verdict to what this person is actually trying to do and the systems they actually use: not to a
company, not to generic usefulness. If you do not know their goals, ask once, or state your assumptions
in a line and proceed. A thing can be good and still not be for them: say that plainly. Decisions that
belong to someone else (a team, a client, a budget owner) are named as theirs.

### 5. Write the note

```yaml
---
title: <short name>
kind: tool | knowledge | process
status: to-test | tested | adopted | kept | dropped
verdict: <one sentence the user can act on>
source: <author or account>
url: <original link>
date: YYYY-MM-DD
---
```

Status: `to-test` worth a trial nobody has run; `tested` tried, verdict written; `adopted` now part of how
they work; `kept` knowledge worth saving with nothing to test; `dropped` evaluated and rejected (say why,
so it is not evaluated twice).

Sections: **What it is**, **What I verified** (with date and versions), **What the post does not say**,
**Fit for you**, **Pending**.

Write in English unless the user wrote in another language: then the note follows their language.

### 6. Hand it over

Return the note as markdown in the reply, leading with the verdict and a short table if it helps. Do not
save it anywhere unless the user names a place. If you have an Artifact or HTML publishing tool, offer a
single-page version in one line, and publish only on a yes. Offer one next step: try it, track a task,
or drop it.

## Gotchas

- A claim you could not verify stays marked "says the post". Do not soften it into fact.
- Desktop tools on Linux can need a window manager even in a container. A virtual display alone may not
  be enough, so budget for that when trying one.
- Clean up test containers and temp folders when you finish, or say they were left behind.
- Never install anything on the user's live setup as part of evaluating it. Installing is a separate
  step they approve.
