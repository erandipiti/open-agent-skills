---
name: conversion-signal-audit
description: >
  Use when a conversion, analytics or attribution signal has to be fixed,
  contained, or measured — "we stopped sending duplicate conversions", "is the
  monitor polluting our analytics", "the pixel fires twice", "server-side CAPI
  is deduping now", "how much of this traffic is bots", "why does the ad
  platform report more conversions than the CRM". Also use before reporting any
  tracking fix as complete, and when quantifying a subpopulation (synthetic
  traffic, one campaign, one funnel) that lives across two data stores.
  Covers enumerating every surface that can emit a signal, closing a leak on
  all of them rather than on the one you changed, and sizing a population by
  joining on identity instead of re-deriving it per store.
---

# Conversion Signal Audit

**Created by Erandi Rodríguez.**

Internal skill. It encodes two failures that both produced a confident, wrong
report about tracking — one about scope, one about measurement — in a stack
where the same conversion can leave the building through four different doors.

## The two rules everything here serves

1. **A fix is scoped to a code path. A signal is scoped to every surface that
   can emit it.** Verifying the path you changed proves the change works. It
   does not prove the leak is closed.
2. **Two independent measurements that agree beat one careful measurement.**
   Join on identity, filter on time exactly once, and confirm the answer with a
   property the other system owns.

## Phase 1 — Enumerate the emitters, before touching anything

Never start from the code you are about to change. Start from the signal and
list every surface that can produce it. In a typical funnel stack that is at
least:

| Surface | Where it lives | How it emits |
|---|---|---|
| Server-side API | a relay, a backend job, a queue worker | CAPI / Measurement Protocol / Ads API upload |
| Browser tag | tag manager container, hardcoded pixel | a `dataLayer` push, or a direct `fbq`/`gtag` call |
| Offline / batch | scheduled upload, CSV import, CRM sync | conversion upload with a click id |
| CRM-triggered | automation in the CRM itself | webhook or native integration |

Write the list down before proposing the fix. The output of this phase is the
sentence "this signal can be emitted by N surfaces", and every later claim is
scoped to that N.

**The failure this prevents, verbatim:** a server-side conversion guard was
fixed on a PHP relay, verified exhaustively on that path — every payload
replayed, every skip and send confirmed — and reported closed. The same
conversion also fired from the browser, pushed to the `dataLayer` on every
successful lead, with unpaused Meta / Google Ads / GA4 / Bing tags listening.
The verification was deep and single-surface, so the report was wrong in the
one way that mattered: the leak was open the whole time.

### The question that has to be answered out loud

> Which **other** surface can emit this same event, and did I check it?

An audit that cannot answer that is not finished, no matter how thorough the
part that was checked.

## Phase 2 — Check the tag manager as a data source, not as configuration

For each browser-side emitter, resolve three things and record them:

- **The trigger**: which event, on which pages, with which conditions. A
  paused tag and a tag with an unmet condition look identical in a report and
  are not the same thing.
- **Consent gating**: whether the push is gated at all. A `dataLayer` push that
  happens before consent resolves is a live emitter regardless of what the tag
  does with it.
- **Which platforms listen**: one event routinely feeds four vendors. Closing
  it for one is not closing it.

Read this from the container, not from the site's source: the site shows the
push, the container decides who hears it.

## Phase 3 — Measure by joining on identity

When sizing anything — synthetic traffic, one campaign's share, the gap between
two systems — do not apply the same date filter to both stores and compare the
totals.

**The method:**

1. Pick the store that can *identify* the population — the one carrying the
   signature (user agent, origin IP, source tag, click id).
2. Harvest an explicit key list from it: session id, distinct id, lead id.
3. Join on that key in the other store, **with no date filter on that side**.
4. Filter by time on **one** side only, and state the timezone of each store in
   the finding.
5. Confirm the total against an independent property the destination system
   owns (an OS breakdown, a device split, a referrer mix). Agreement between two
   unrelated properties is the evidence; a single careful count is a hypothesis.

**The failure this prevents, verbatim:** sizing a monitor's share of an event
store by filtering both the request log and the events table to the same
calendar day returned 63 sessions against 90. The 30% gap was a timezone
boundary — the request log kept Phoenix time, the event store did not — and it
would have been reported as "most monitor traffic is not reaching analytics",
which is the opposite of the truth. Joining on the distinct id, filtering time
once, and cross-checking against the OS breakdown all agreed at ~75%.

## Phase 4 — Report scope explicitly

The report says, in this order:

1. **Surfaces enumerated** — the list from Phase 1, including the ones found
   clean. A surface that was not checked is named as not checked.
2. **What changed, and on which surface.**
3. **What still emits** — every surface that can still produce the signal, even
   when leaving it open was the right call.
4. **Numbers with their population and their timezone.** "1,400 events" is
   unreadable; "1,400 of 1,860 sessions (75%), events store in UTC, request log
   in America/Phoenix" is a finding.

Never write "fixed", "closed" or "no longer fires" about a signal when the
audit covered one surface. Write which surface.

## Pre-flight, before delivering any conversion-signal finding

- [ ] Did I enumerate every emitter before proposing the fix, or did I start
      from the code I already had open?
- [ ] For each emitter I did not check: is it named as unchecked in the report?
- [ ] Did I read the tag manager container, not just the site source?
- [ ] Is every count joined on identity rather than re-derived per store?
- [ ] Is the timezone of each store stated next to any date-filtered number?
- [ ] Does every number carry its denominator?
- [ ] Is there a second, independent property that agrees with the headline
      number?
- [ ] Does the report say "on the server-side path" rather than a bare "fixed"?

## Related

- Cross-cutting principle 7 (verification reads back from the running system)
  and principle 9 (a number is not evidence until its lookup and its
  denominator are shown), in
  `~/projects/skill-observations/cross-cutting-principles.md`.
- Source observations: #22 (single-surface verification) and #23 (join on
  identity), in that store's `log.md`.
