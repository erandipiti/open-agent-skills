# Recommendation plays

A play fires only when its **trigger is observed in this run's evidence**. Cite the finding ids
that satisfy the trigger. If a trigger depends on something you could not observe (Instagram
behind a login wall, no Google Business Profile data), the play goes in the report as
**"Condicional: verificar X"**, never as a recommendation stated as fact.

Each play also has an operational prerequisite (someone answers WhatsApp, someone ships orders).
You cannot observe those, so phrase them as a question in "Puntos por aclarar", not as a claim.

| Play | Trigger (observable) | Do NOT recommend when | Typical tool (MX) |
|---|---|---|---|
| WhatsApp click-to-chat, sticky, prefilled text | Contact is only phone/email, OR a WA number appears as text without a `wa.me` link, OR `wa.me` link has no prefilled `text` | B2B enterprise / procurement sales | `wa.me/52XXXXXXXXXX?text=` |
| Short lead form (3-4 fields) | Quote-based service AND (no form, OR form action empty/`#`, OR 8+ visible fields) | WhatsApp is already the working channel and nobody reads email | Native form + email/CRM, Tally, Google Forms |
| Online booking | Appointment business (clinic, salon, consultant, classes) whose CTA is "llámanos / escríbenos para agendar" | Booking needs diagnosis or quoting first | Cal.com, Calendly, AgendaPro, Fresha |
| Online store | Physical products shown WITH prices, 10+ SKUs, no cart | Made-to-order, < 10 SKUs, margin depends on chat upsell | Shopify, Tienda Nube, WooCommerce |
| Payment link | Few products, deposits/anticipos, tickets, or a cart that is a builder placeholder | A working checkout already exists | Mercado Pago link, Stripe Payment Links, Clip |
| Remove template leftovers | Any `placeholders` hit ("Soy un producto", "| Misitio", lorem ipsum, internal names like `MENU_TIENDA`) or demo product pages in the sitemap | Never skip. Always a quick win | Builder editor |
| Instagram feed embed | Latest observed IG post within 14 days AND 8+ observed posts in the last 30 days AND the site has no content dated within 90 days | IG latest observed post older than 60 days (embedding advertises abandonment), or IG access was `login_wall` with no dates (→ Condicional) | Builder native IG widget, Behold, Elfsight |
| Hide/fix dead social icon | Social link `verdict: broken`, OR profile `not_found`, OR latest observed post older than 180 days | Profile `login_wall` / `blocked` (unknown is not inactive) | — |
| Reviews on site + review-ask flow | Google rating ≥ 4.3 with 20+ reviews (operator-supplied or Places API) AND no reviews/testimonials on the site | Rating < 4.0: fix operations first | GBP review link, Elfsight, native testimonials |
| Claim/optimize Google Business Profile | No GBP found by search, OR NAP (name, address, phone) differs between site, schema and GBP | Purely online business with no service area | business.google.com |
| LocalBusiness schema | Local business with address/phone on site AND no `LocalBusiness` (or subtype) JSON-LD | Non-local / purely online | JSON-LD in `<head>` |
| Consolidate thin pages | 3+ pages under 100 words, or the same info repeated across pages | Those pages carry search traffic (only knowable with Search Console) | — |
| Prices or "desde $X" | Competitors in the same city show prices AND this site hides them | Truly custom pricing | — |
| Install measurement | No GA4 / GTM / Meta Pixel / Clarity found in `tags` | Never skip. Always top-3: without it no other change can be proven | GA4 + GTM, Clarity (free heatmaps) |
| Email authentication | Domain has MX but no SPF or no DMARC, OR no MX at all while the site shows an `@domain` address | — | DNS TXT records |
| Aviso de Privacidad | Site collects personal data (any form, WhatsApp capture) and no "aviso de privacidad" link/text | Site collects nothing | LFPDPPP requirement (MX) |
| Bilingual | Tourist / cross-border / export audience AND single-language site | Local-only clientele | — |
| Lead magnet / popup | Considered purchase AND traffic exists AND nothing for not-ready visitors | Low traffic: fix the main CTA first | — |
| Redesign (strategic) | 3+ high-severity UX findings across the conversion path, OR Lighthouse mobile performance median < 50 AND builder bloat, OR design-specificity verdict "generic template" | Most problems are content, not layout: fix content first | — |

## Ranking

Score each candidate action: **Impact (1-5) x Confidence (0.5 / 0.8 / 1.0) / Effort (1-5)**.

- Impact anchors: 5 = blocks contacting or buying; 4 = loses a share of mobile visitors or trust;
  3 = search visibility; 2 = polish that a visitor notices; 1 = invisible hygiene.
- Confidence: 1.0 = measured directly; 0.8 = observed but partial (one viewport, one sample);
  0.5 = conditional on something we could not see.
- Effort anchors: 1 = under 1 hour in the builder; 2 = under 1 day; 3 = 1-3 days; 4 = 1-2 weeks; 5 = rebuild.
- **Override:** a confirmed broken contact or purchase path is #1 regardless of score.

Buckets on page one: 3 quick wins (effort ≤ 2), 3 core fixes, 2 strategic investments. Everything
else goes to the appendix backlog.
