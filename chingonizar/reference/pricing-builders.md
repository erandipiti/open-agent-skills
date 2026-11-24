# Website builder pricing reference (Mexico, late 2026)

Optional reference, prices seen on 2026-11-08, re-check before use. Mexico-specific: sources and market bands are for Mexico. Every number has its source URL and
the date it was seen. **All figures seen 2026-11-08** unless a row says otherwise.
Prices change often and vary by region: re-check the official page before putting a
number in front of a client.

Legend: "no visible" = the page did not show it. "3rd-party" = not from the vendor, treat
as unverified.

---

## 1. Wix

### What the official page showed (fetched from a Mexican IP)

Source: https://www.wix.com/plans (rendered in a headless browser from a machine whose
public IP geolocates to Mexico; seen 2026-11-08).

- Currency shown: **USD**, not MXN. Page note, verbatim: "Prices and currency vary by
  location. USD prices displayed for reference only. Displayed prices are for yearly
  subscriptions, paid in full at the time of purchase ... Prices do not include
  applicable taxes, which are determined according to your billing address. The final
  price can be seen on the purchase page."
- MXN price: **no visible** (the localized price only appears at checkout).
- Monthly-billing price: **no visible** on the official page.
- The raw server HTML also contains hidden variants ("$17.77/mo ... Price includes GST",
  account currency "EUR"); those are other-region templates, not what renders. Ignore.

| Plan | USD/mo, billed yearly (official) | USD/mo, billed monthly (3rd-party, unverified) | Storage | Accept payments / eCommerce | Bookings | Collaborators |
|---|---|---|---|---|---|---|
| Free | $0 | n/a | not stated | No | No | not stated |
| Light | $17 | $24 | 2 GB | **No** ("Sites on this plan cannot accept payments") | No | 2 |
| Core | $29 | $36 | 50 GB | Yes, "Basic eCommerce" | Yes ("Scheduling and services") | 5 |
| Business | $39 | $46 (one source says $43) | 100 GB | Yes, "Standard eCommerce" | Yes | 10 |
| Business Elite | $159 | $172 | Unlimited | Yes, "Advanced eCommerce" | Yes | 100 |

Sources:
- Yearly prices, storage, eCommerce tier, collaborators, "Free domain for 1 year" on all
  paid plans: https://www.wix.com/plans (seen 2026-11-08).
- Light cannot accept payments; Core = "Accept payments", "Sell products online",
  "Booking functionality"; all plans remove Wix branding; "Each plan comes with a custom
  domain": https://support.wix.com/en/article/introducing-new-premium-plans-for-the-wix-editor-5324449
  (article undated, appears to be 2023; seen 2026-11-08).
- Wix announced price increases for some plans on new subscriptions and renewals, figures
  only in a linked PDF: https://support.wix.com/en/article/upcoming-changes-to-wix-premium-plan-pricing
  (undated; seen 2026-11-08).
- Monthly-billed figures ($24/$36/$46/$172) are 3rd-party, from search-result summaries of
  https://www.stylefactoryproductions.com/blog/wix-pricing and
  https://www.websitebuilderexpert.com/wix-pricing ; https://www.expertmarket.com/website-sales/wix-pricing
  gives Business at $43. Not verified on wix.com (seen 2026-11-08).

### Minimum plan for each capability

| Capability | Minimum plan | Source |
|---|---|---|
| (a) Connect a custom domain, remove Wix ad banner | **Light** (any Premium plan) | wix.com/plans FAQ: "With a Premium plan you can connect your own domain, remove Wix branding"; dev docs: domains connect only with an active Premium plan, https://dev.wix.com/docs/rest/account-level/domains/connected-domains/introduction |
| (b) Sell products with cart and checkout (accept payments) | **Core** | support article above: Light "cannot accept payments"; Core "Accept payments", "Sell products online" |
| Wix Bookings with online payment | **Core** | same support article ("Booking functionality" on Core) |
| Wix Restaurants online orders | **A Premium plan that accepts payments**, so in practice **Core** | Wix support: Premium needed to take online orders and receive payments; menus can be shown without one: https://support.wix.com/en/article/wix-restaurants-an-overview (seen 2026-11-08). Exact tier inferred from (b), not stated by Wix. |
| (c) Members Area with "My Account" page | **No Premium requirement found**. Wix support describes My Account as a default page of every Members Area, with no plan gate stated. | https://support.wix.com/en/article/site-members-add-and-set-up-a-members-area (seen 2026-11-08). A competitor (MemberSpace) claims paid memberships need Business; unverified. |
| Selling paid memberships / Pricing Plans | Needs payments, so at least **Core** (inferred from (b)) | inference, not a Wix statement |

### Costs on top of the plan

| Item | Price | Source |
|---|---|---|
| Domain, first year | Free with a yearly Premium plan (voucher, first purchase only, redeem within 60 days, new domains only) | https://www.wix.com/plans FAQ (seen 2026-11-08) |
| .com domain bought without plan, first year | $7.90 USD | https://www.wix.com/blog/how-much-does-a-com-domain-cost-on-wix (post "Updated: Oct 20", year not shown; seen 2026-11-08) |
| .com domain renewal, 1 year | **$21.35 USD** | same Wix blog page |
| Google Workspace email via Wix | Wix price **no visible** on an official page. Wix says the per-user price is rising at next renewal: https://support.wix.com/en/article/business-email-price-increase-for-google-workspace-plans . 3rd-party: about $6 to $6.50 USD per mailbox/month (https://ca.hostadvice.com/hosting-company/wix-com-reviews/wix-business-email-pricing/). Google list price reference (3rd-party summary): Business Starter $7/user/mo on annual, $8.40 flexible. | seen 2026-11-08 |
| Taxes | Not included in displayed Wix prices; set by billing address (so Mexican IVA would apply at checkout) | https://www.wix.com/plans |

---

## 2. Other platforms (brief)

### Squarespace (page served MX$ to our fetch)

Source: https://www.squarespace.com/pricing (seen 2026-11-08). The page showed two prices
per plan without a clear label; the higher one is most likely month-to-month and the lower
one billed annually. Confirm before quoting.

| Plan | MX$/mo (higher, likely monthly) | MX$/mo (lower, likely annual) | Store transaction fee | Digital content / memberships fee | Free custom domain |
|---|---|---|---|---|---|
| Basic | MX$250 | MX$170 | 2% | 7% | Yes (annual term) |
| Core | MX$350 | MX$250 | 0% | 5% | Yes |
| Advanced | MX$490 | MX$360 | 0% | 0% | Yes |

### Shopify Mexico

Source: https://www.shopify.com/mx/precios (seen 2026-11-08). MXN.

| Plan | Billed monthly | Billed annually (per month) | Online card rate (Shopify Payments) | Fee if using an external payment provider |
|---|---|---|---|---|
| Basic | $399 MXN | $299 MXN | 3.5% + $3.00 MXN | 2% |
| Grow | $949 MXN | $829 MXN | 3.4% + $3.00 MXN | 1% |
| Advanced | $6,999 MXN | $6,299 MXN | 3.3% + $3.00 MXN | 0.6% |
| Plus | from $2,300 USD/mo | no visible | 3.1% + $3.00 MXN | 0.2% |

Promo on page: "Prueba 3 días gratis, luego paga $20/mes durante 3 meses" (currency not
stated). Domain: not included in plan price (no visible).

### Tiendanube Mexico

Source: https://www.tiendanube.com/mx/planes-y-precios (seen 2026-11-08). MXN, monthly
only (no annual price visible).

| Plan | MXN/mo | Fee on other payment methods | Pago Nube processing |
|---|---|---|---|
| Gratis | $0 | no visible | from 3.99% + $3 + IVA |
| Básico | $149 | 2% | from 3.49% + $3 + IVA |
| Tiendanube | $374 | 1% | from 3.39% + $3 + IVA |
| Avanzado | $999 | 0.7% | from 3.29% + $3 + IVA |
| Evolución | "A consultar" | negotiable | negotiable |

Own domain: "Configuración de dominio propio" listed on Básico; the FAQ says plans include
own domain, hosting and SSL. Domain registration cost itself: no visible.

### Hostinger Website Builder Mexico

Source: https://www.hostinger.com/mx/creador-de-paginas-web (seen 2026-11-08). MXN, intro
price requires a **48-month prepaid term**; renews higher.

| Plan | Intro MXN/mo | Paid upfront (48 mo) | Renewal MXN/mo | Sites | eCommerce | Domain |
|---|---|---|---|---|---|---|
| Premium | 32.99 | 1,583.52 | 149.99 | up to 3 | not named for this plan | free 1 year |
| Unlimited | 49.99 | 2,399.52 | 299.99 | unlimited | "Ecommerce disponible" | free 1 year |
| Cloud Startup | 140.99 | 6,767.52 | 455.99 | unlimited | "Ecommerce disponible" | free 1 year |

Transaction fees: "Sin comisiones por transacción" (payment processor fees still apply).

### WordPress on shared hosting (Hostinger Mexico as the reference)

Source: https://www.hostinger.com/mx/hosting-web (seen 2026-11-08). MXN, intro price on a
48-month term.

| Plan | Intro MXN/mo | Paid upfront (48 mo) | Renewal MXN/mo | Sites | Free domain | Email |
|---|---|---|---|---|---|---|
| Single | 24.99 | 1,199.52 | 89.99 | 1 | page conflicts (card says yes, FAQ says all plans except Single) | 1 mailbox |
| Premium | 32.99 | 1,583.52 | 149.99 | 3 | 1 year | 2 per site, 1 year |
| Unlimited | 49.99 | 2,399.52 | 299.99 | unlimited | 1 year | unlimited per site, 1 year |

eCommerce on WordPress = WooCommerce (free plugin), no platform transaction fee; payment
gateway fees apply. Premium themes/plugins are extra.

---

## 3. Inferring a public Wix site's plan

### Signals in the page HTML (verified by fetching on 2026-11-08)

Wix's server-rendered HTML embeds viewer config JSON. Fetch with
`curl -sL -A "Mozilla/5.0" https://<domain>` and grep for:

| Field | Meaning (as observed) |
|---|---|
| `"isPremium":true` | The site has a Premium plan. Does **not** say which tier. |
| `"isPremiumDomain":true` | Served on a connected custom domain (Premium feature). |
| `"freemiumBanner":false` | Wix ad banner not shown. |
| `"coBrandingBanner":false` | No co-branding banner. |
| `"appDefinitionName":"..."` | Apps **installed** on the site (installed is not the same as in use). |
| `"pageUriSEO":"..."` and `/sitemap.xml` | Real pages: `cart-page`, `checkout`, `product-page`, `my-account`, `plans-pricing`, `menus`, etc. |

Caveat: I could not fetch a free `*.wixsite.com` site as a control, so the `false`
values on a free site are expected but not verified here. No field naming the plan tier
(Light/Core/Business) was found in either site's HTML.

### What two sample sites showed (seen 2026-11-08)

| Signal | Site A (Wix, store apps) | Site B (Wix, restaurant apps) |
|---|---|---|
| `isPremium` | true | true |
| `isPremiumDomain` | true | true |
| `freemiumBanner` / `coBrandingBanner` | false / false | false / false |
| Commerce apps installed | Wix Stores, Checkout & Orders, Wix Pricing Plans, My Wallet, My Subscriptions, Wix Art Store, Old Wix Forms and Payments | Wix Restaurants Orders 2, Wix Restaurants Menus (+ Old) |
| Members | Wix Members Area, My Account, My Addresses, Wix Groups | Wix Members Area, Member Account Info (`/my-account`, router prefix `account`) |
| Commerce pages | `cart-page`, `checkout`, `product-page`, `my-orders`, `plans-pricing`, `thank-you-page`; `store-products-sitemap.xml` lists **11 products, all named "Soy un producto..."** (Wix template placeholders) | sitemap lists only `/`, `/menus`, `/my-account`; **no online-ordering page** in sitemap |
| Minimum plan inferable | **At least Light** (proven: custom domain, no ad). **Core** needed only if the store actually takes payments; the placeholder products suggest it may not be in use. | **At least Light** (proven). Core only if Restaurants online ordering is actually live; sitemap suggests it is not. |

Bottom line: from outside you can prove "Premium, at least Light". You cannot prove the
tier. Ask the owner for the Wix invoice, or check their Wix dashboard > Subscriptions.

---

## 4. Mexican market references for services

**Market references only, not facts about any client.** Mostly vendor or marketplace
content with commercial interest.

| Service | Range | Source |
|---|---|---|
| Simple website | $7,000 to $14,000 MXN | Cronoshare, "Precios en 2026", dated 9 Jan 2026: https://www.cronoshare.com.mx/cuanto-cuesta/disenar-pagina-web |
| Complete website | $14,500 to $22,000 MXN | same |
| National average | $7,000 to $15,000 MXN ("indicativos") | same |
| Online store | from $15,000 MXN | same |
| Landing / one-page | $3,000 to $10,000 MXN freelance; above $10,000 MXN agency | GoDaddy LATAM, dated 20 Nov 2025: https://www.godaddy.com/resources/latam/clientes/cuanto-cuesta-una-pagina-web-mexico |
| SME corporate site | $10,000 to $30,000 MXN | same |
| Basic template eCommerce | $18,000 to $40,000 MXN | same |
| Monthly maintenance | $3,000 to $10,000 MXN/month typical; text gives $1,800 to $14,000+ | Cronoshare, dated 4 Jan 2026: https://www.cronoshare.com.mx/cuanto-cuesta/mantener-pagina-web |
| Hourly rate (maintenance) | $400 to $600 MXN/hour | same |
| Maintenance, small/medium site | 5 to 500 USD/month | GoDaddy LATAM, dated 19 Mar 2026: https://www.godaddy.com/resources/latam/desarrollo/costo-mantenimiento-pagina-web |

Gaps: no Mexico-specific price found for "Wix redesign" as a distinct service; Fiverr Wix
redesign gigs showed no visible package prices in search results; no Workana average for a
5-page site was found (Workana has an estimator, figures not public in results). Mapping:
(a) Wix redesign ≈ "simple website" band; (b) new 5-page site ≈ "simple" to "complete"
band; (c) maintenance = Cronoshare monthly band. That mapping is a judgement, not a source.

---

## How to estimate what a client pays today

1. **Prove Premium.** curl the homepage, grep `"isPremium":true`,
   `"isPremiumDomain":true`, `"freemiumBanner":false`. If all present: at least Light.
2. **Look for payment use.** Check `/sitemap.xml` (look for `store-products-sitemap.xml`),
   `pageUriSEO` values (`cart-page`, `checkout`, `book-online`, order-online pages) and
   installed apps. Real products or live ordering/bookings with payment ⇒ at least Core.
   Placeholder products ("Soy un producto") or installed-but-unlinked apps do not count.
3. **Price it (Wix, official USD, billed yearly, before tax):** Light $17/mo (≈ $204/yr),
   Core $29/mo (≈ $348/yr), Business $39/mo (≈ $468/yr). Billed monthly is higher
   (3rd-party: $24 / $36 / $46). Add IVA at checkout. Wix shows the MXN amount only at
   checkout, so quote USD or say "approx." when converting.
4. **Add extras:** domain renewal after year 1 ($21.35 USD/yr for .com if bought via Wix;
   less if registered elsewhere), Google Workspace if they use it (Wix price not public;
   ~$6 to $7 USD per mailbox/month as a reference).
5. **Present it as a range** ("between Light and Core, about US$17 to US$29 a month billed
   yearly, plus domain"), and ask the owner for the invoice to confirm.
