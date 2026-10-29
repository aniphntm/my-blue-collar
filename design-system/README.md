MyBlue Edge is one system for every MyBlue channel. The **web** surface (`c-*` tokens) is the base. Financial, Careers, the app shells and the static sites are namespaced layers on top. Build with the web base unless the work lives in another channel.

## Channels

| Channel | Where it lives | Tokens | Type | Radius | Theme |
| --- | --- | --- | --- | --- | --- |
| Web (Trade, Work) | landing, `app/page.tsx` | `c-*` | Arial, system mono (`sans`, `mono`) | `radius-card` 8px | light and dark |
| Financial | `public/coin`, mybluefinancial.com | `fin-*` | DM Sans, IBM Plex Mono (`fin-sans`, `fin-mono`) | `radius-fin` 4px | light and dark, `data-theme` toggle |
| Careers | `/apply` | `apply-*` | Arial 800, caps | `radius-apply` 0 | light |
| App shells | issuer console, customer wallet, mobile | `app-*` | Arial | `radius-app-sm/md/lg` | light |
| Static sites | mybluetrades.vercel.app, docs memos | `site-*` | Inter (`site-sans`) | `radius-site` 30px | light |

The channels disagree on the accent blue (`c-accent` `#2563eb`, `app-blue` `#3457f1`, `fin-blue` `#163ff3`, `apply-blue` `#164de5`, `site-blue` `#155eef`), radius and theme mechanism. Do not mix tokens from two channels on one screen. The brand logo gradient (`brand-blue-light` `#3b82f6` to `brand-blue-deep` `#1d4ed8`) is shared.

## Content fundamentals
- Write sentence case, second person, plain trade language. "Your work, all in one thread." Not "Leverage a unified platform."
- Headlines are short declaratives or fragments, broken into two or three lines: "Get jobs. / Get paid. / Repeat." On mybluetrades.com it is "Jobs. Paid. Repeat."; on mybluework.com "Every job has one thread."
- Name the benefit, then the rule that backs it. Card titles are promises ("Free stays free", "Nothing falls through", "Your customers are yours") and the footer is the rule ("RULE → the essentials never go behind a paywall").
- Promise only what ships. Mark the rest "Coming soon" or "Illustrative", as the source does for Pro, Network and the hero flow panel. Never present a sample figure as a measured one.
- Eyebrows are mono caps joined with ` · ` and `→`: "FREE · NOT A TRIAL", "01 — The platform". Step markers are ".01", ".02".
- No emoji in copy. CTA labels are verbs or destinations: "Join →", "Start free", "Get notified", "Join the waitlist →".
- Careers is all caps and declarative: "BUILD THE COMPANY TRADES WILL RUN ON." Financial is calm and principled: "Money should move on your terms."
- Errors say what to do: "We could not reach the application service. Check your connection and try again."

## Visual foundations

### Color
- The web base is warm paper (`c-bg` `#faf9f6`) and warm black (`c-bg` dark `#131109`), with off-black `c-text` `#14130e` and off-white `#ebe7de`. Never pure `#000` or `#fff` for text.
- One accent per screen: `c-accent`, used for the primary fill, links and one status eyebrow. Text on `c-accent` is `c-on-accent` (white in light, near-black in dark), never literal white.
- Text tiers: `c-text` headings and key values; `c-text-3` body and ledes; `c-text-mut` secondary; `c-text-faint` eyebrows and placeholders on `c-bg` and `c-surface` only (on `c-bg-alt` use `c-text-mut`).
- Dark insets use `c-panel`, `c-panel-2` and `c-panel-text/soft/faint`. The inset stays dark in both themes.
- Separate with hairlines (`c-border`, `c-border-soft`, `c-border-mid`), not fills. A control's boundary is `c-border-control`, never `c-border`.
- Status is always in words. The `c-thread-*` hues are decoration only.

### Type
- Display and headings use `sans` at weight 500 with tight tracking: `display-xl`, `display-lg` (-0.022em), `heading-lg/md/sm` (-0.02em). Body is `body` 15px/1.625 with -0.011em set on the document.
- Eyebrows and numerals use `mono` at 11px: `eyebrow` (.08em caps), `rule-line` (.04em caps), `step-index`.
- The stack renders **Arial**, which has no 500 or 600 face, so `font-medium` shows at 400 and `font-semibold` at 700. The `--font-geist` variable in the source resolves to Arial; Geist is bundled in `fonts/` but not loaded anywhere. Wire it in on purpose before relying on weight 500.
- Financial uses DM Sans and IBM Plex Mono from Google Fonts; the static sites use Inter. Careers sets Arial 800 in caps with `-0.075em` tracking.

### Layout and spacing
- Content is `page-max` (72rem) with a 24px gutter (`space-6`). Sections are `space-24` (96px) top and bottom; a section head sits `space-16` above its grid; cards pad `space-8`.
- The sticky nav is `nav-height` (3.5rem). A hero may carry the 64px graph-paper wash (`c-grid`, `grid-pitch`).
- Card grids are hairline grids: 1px gaps over a `c-border` field, no individual card borders. Avoid repeating the same three-card grid in consecutive sections.

### Radius, elevation, motion
- One radius on web, `radius-card` 8px, for buttons, fields, cards and panels; `radius-pill` for pills and dots. Careers is square.
- Elevation is rare: `shadow-panel` appears on the hero flow panel and the waitlist card only. It barely registers on dark grounds; do not use it to separate surfaces in dark.
- Web motion is color transitions only (150ms). Financial has a full token set (`motion.css`):

| Token | Value | Use |
| --- | --- | --- |
| `--motion-press` | 80ms | pointer pressure, 1px settle |
| `--motion-fast` | 140ms | tab panel, status, theme color, 4px settle |
| `--motion-ui` | 220ms | nav underline, menu, disclosure, 8px |
| `--motion-enter` | 360ms | arrival and section intro, 12px |
| `--motion-stagger` | 40ms | hero elements, total delay at most 120ms |
| `--motion-ease-out` | cubic-bezier(.16,1,.3,1) | arrivals |
| `--motion-ease-in` | cubic-bezier(.4,0,1,1) | dismissals |
| `--motion-ease-move` | cubic-bezier(.4,0,.2,1) | position changes |

  Use transform and opacity only; no bounce, no looping, no parallax, no count-up on money. Honor `prefers-reduced-motion` from the first frame; a new action supersedes a running one.

### States
- Hover shifts color over 150ms: links `c-text-mut` to `c-text`, primary `c-accent` to `c-accent-dark`, secondary border `c-border-mid` to `c-text`. Disabled is 60% opacity with `not-allowed`.
- Focus is a 2px `c-accent` ring with a 2px offset (an addition; the source relies on the browser default). `c-accent` is at least 3:1 on `c-bg`, `c-bg-alt`, `c-surface` and `c-panel` in both themes. Selection uses `c-mark` and `c-on-mark`.
- Hit areas are at least `touch-min` (44px).

## Iconography
- There is no icon set. The source uses text glyphs: `→` before list items and on CTAs (`aria-hidden`), mono `+` and `−` on disclosures, and CSS dots (`radius-pill`) for markers. Keep to these on the web.
- The console and wallet use emoji and glyph icons (⚒ ☕ ▣ ◫ ↓ ↗) and first-letter nav tiles that repeat "A". Do not extend them; choose one SVG icon family first.
- The brand marks are in Logos: the wordmark `myblue-transparent.svg` for headers on light grounds, the `mb` tile `icon.svg` for avatars and app icons, `icon-inverse.svg` (white tile) and `icon-transparent.svg`. On dark grounds use the tile; the wordmark's deep blue end is about 2.8:1 on `c-bg` dark. Keep one stroke width of clear space. The logo guidance is the brand kit's own "starter guidance, not an established standard".
- Legacy holds the older Arial-text logos from `assets/`; the kit calls them superseded. `assets/Financial/mybluecoin.jpg` is the BLUE token mark, shown as a 148px circle.

## Names
The source calls the product MyBlueTrade (web nav, footer and `<title>` on every host), MyBlue Work (careers, mybluework.com), BlueCollar (one sentence in `job-threads.tsx`), bluework (issuer console), bluefinancial (wallet) and "myblue." (Financial). This system does not pick one: pass `brand` per channel until the naming decision is made.

## Accessibility rules
- Body text is at least 4.5:1 on its ground in every theme; 3:1 for text of 24px or more and for control boundaries, focus rings and icons. Colors that must be told apart differ in lightness, and status always carries a word.
- Every input has a visible label; errors are plain sentences linked with `aria-describedby`. Put a skip link first on any page with a sticky nav.
- Interactive text is at least 12px; the source's 9 to 11px mono is for non-critical labels. Do not set a contract address below 12px.

### Known contrast failures (source values kept exact)
| Pair | Ratio | Where | Use instead |
| --- | --- | --- | --- |
| `app-faint` on white | 2.60:1 | console and wallet section labels | `app-muted` (4.97:1) |
| `app-muted-2` on white | 3.77:1 | helper text, metric labels, timestamps; mobile eyebrow on `app-bg` is lower | `app-muted` |
| `c-text-faint` on `c-bg-alt` (light) | 4.39:1 | eyebrows and step numbers in Pricing, JobThreads, Flow | `c-text-mut` (5.03:1) |
| `site-muted` on white and on `site-bg` | 4.02:1, 3.71:1 | static-site hero bar, 11px | `site-text` (6.91:1 on white) |
| `c-border` on `c-surface` | 1.29:1 light, 1.21:1 dark | waitlist field borders | `c-border-control` |
| `apply-line` on white | 1.66:1 | careers field underlines | `apply-ink` |
| `fin-line` on `fin-paper` / `fin-surface` | 1.23:1 light, 1.52:1 dark | token-address box | a 3:1 boundary |
| `app-border-control` on white | 1.48:1 | outline button, mobile input | a 3:1 boundary |

`app-warn-text` on `app-warn-bg` is 4.50:1, at the floor with no margin.

## Intentional additions (not in the source)
`c-border-control` (the one invented token), the focus ring, 44px hit areas, visible field labels with a "(required)" marker, `aria-controls` on FAQ rows and an optional skip link on Nav. `c-error` and `c-thread-*` come from the source's Tailwind palette but were not named custom properties there.

## Open items
- Google Sans, the typeface the brand kit says the website references, is not bundled and not rendered; Geist is bundled but also not rendered. PNG exports of the logos and the Expo placeholder app icons are not included.
- The production deploy has `/free` and `/network` routes that are not in the main checkout; they are not covered here.
- The Financial motion layer and the hiring tables are in the repo but not in the 2 September production deploy.
