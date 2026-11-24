---
name: go-deep
description: Use when the user wants to learn a topic beyond the obvious, understand what is really going on under the surface, or find the non-obvious insights about anything (a field, a market, a skill, a decision, a tool, a habit). Triggers include "/go-deep <topic>", "go deep on", "ir a fondo", "profundiza en", "qué no me están diciendo de", "enséñame lo que no sabe la gente de". Works for any subject, work or personal; an optional lens can aim it at a specific context such as a company or role.
---

# go-deep: past the obvious, with sources

Turns a topic into a layered briefing: what most people believe, what practitioners know,
and what operates underneath. Based on the "hidden reality" structure, minus the role-play.

## Input

- **Topic** (required). If the user gave none, ask for it in one line.
- **Lens** (optional). A context to aim the result at: a role, a business, a company, a
  goal ("for a small agency", "for a solo freelancer"). With no lens, stay general. Never
  assume a lens the user did not give, and never tie the topic to any company by default.
- **Depth** (optional): `quick` (about 300 words) or `full` (default, about 800).

## How to run it

1. **Ground it first.** For anything factual or recent, search before writing. Prefer
   primary and official sources. Do not answer a factual topic from memory alone.
2. **Write the briefing in this order:**
   1. **Lo que cree la mayoría.** The common view, in two or three lines.
   2. **Lo que saben quienes lo practican.** What experienced people do or say differently.
   3. **Lo que opera por debajo.** Incentives, mechanisms, feedback loops, second-order
      effects, asymmetries. Name each one and say why it matters.
   4. **Qué cambia en la práctica.** Three to five concrete things to do, check or stop
      doing differently.
   5. **Dónde podría estar equivocado esto.** The strongest counterargument or limit.
3. **Label every claim by confidence:** *verificado* (with source and date), *consenso
   razonable* (widely held, no single source) or *mi inferencia*. If you cannot tell which,
   say it is unverified.
4. **Close with the next step:** one question worth asking an expert, or one cheap way to
   test the main idea.

## Rules

- **No invented authority.** Do not role-play a Nobel laureate or "the top 0.1%". Say what
  you know and how sure you are.
- **No invented numbers.** Figures, ranges and statistics need a source you opened. If
  there is none, give the direction and say the number is missing.
- **Non-obvious means checked.** A "hidden truth" that sounds clever but has no support
  goes under "mi inferencia", not under fact.
- **Stay on the topic.** Do not widen into adjacent subjects to look deeper.
- **Match the user's language.** Spanish in, Spanish out.

## Optional context lens

If the user supplies a lens (a company, role or policy), add a final section **Para <lens>**
and follow any constraints the user states for it. Without a lens, add nothing.
