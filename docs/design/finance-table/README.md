# MyBlue Finance entry-page refinement

Prepared from the user's Grok Table.pdf for `https://app.myblue.finance` on October 16, 2026 UTC.

## Status and provenance

This is a browser-verified design preview and an opt-in CSS integration patch. It is **not a production release** and does not replace `apps/financial-onboarding`.

The requested hostname redirects to `https://myblue.finance/`. Vercel maps both hosts to `myblue-finance-app` (`prj_3rQds32rTpY3NphUkB1LOgKM6aZE`), with production deployment `dpl_AfNV1PJb76BBYeLJ2fSURD3fzhGw`. That deployment was created through the CLI and exposes no Git commit metadata. Its `home.html` and `src/banking/entry.css` are not present in the inspected GitHub main, increase or banking-consolidation source trees. Do not deploy an older authentication branch over that application to deliver these visual changes.

`baseline.html` and the entry CSS/JS bundles in `assets/` were downloaded from the public rendered app. They are a frozen **build-output snapshot**, not recovered original source. `index.html` adds the scoped stylesheet, light theme metadata and absolute links to the existing live demo routes. The original public scripts are preserved byte-for-byte. The preview server also redirects dynamically selected demo paths to the live app. It serves no financial backend and accepts no mutation methods. The optional wallet interface is the existing connection-only UI; real-wallet behavior was not exercised.

## Integration

1. Locate the checkout that produced the deployment above; reconcile its source with the current production release.
2. Copy `refinement.css`, `fonts.css` and the licensed Geist font files to a suitable public asset path. Adjust relative font URLs to that path.
3. Load the new CSS **after** the current entry stylesheet and add `finance-refined` to the entry page's body. Update the theme-color meta value to `#ffffff`.
4. Remove the obsolete DM Sans/Manrope import from the original entry stylesheet once Geist is integrated. Optionally remove the decorative `.connection-map` and `.card-art` markup hidden by the patch.
5. Verify the same onboarding states, mobile navigation, demo destinations and backend interlocks against the exact source commit. Release that commit through the existing production pipeline.

Do not deploy this snapshot as the application: it does not contain the deployed banking APIs, dashboard source or routing configuration. No production deployment, domain change, account creation or funds movement was performed.

## Table adaptation

| Table guidance | Application to this entry page |
| --- | --- |
| One typeface | Geist for body, navigation, headings and controls; fonts included with OFL license. |
| Paper, ink, line, muted, blue tokens | White paper, `#11110f` ink/rules, `#11110f99` muted and `#164de5` accents. |
| Restrained blue | Hero accent line, primary action, current navigation and focus affordances. |
| Remove viewport lock | Removed the hero minimum height; 72px section padding, 28px headline-to-copy gap. |
| Smaller headline and looser tracking | Maximum 112px, tracking -0.045em; fluid scale adapted to the app's sidebar and two-column frame. Line-height .95 avoids clipping. |
| Delete decorative field | Hide orbit illustration, decorative card art, decorative glyph badges and status dots. |
| Solid header | 68px white header with a 1px ink rule; no blur. |
| Mobile navigation | Below 760px, all six named destinations remain in one horizontally scrollable row. Tablet navigation retains text labels. |
| Lowercase kickers | 11px, weight 600, muted; lowercase navigation has weight 700 and 0.04em tracking. |
| Column spacing | Product links use 28px padding and ink dividers, 22px titles and 16px body text. |
| Footer | 12px muted, rule above, legal text capped at 65ch. |
| Repeat underline, manifesto, tier availability, FX, join form labels | These sections are absent on this entry page. No substitute sections or form fields were invented. |

The page's copy, demo disclosure and three-step onboarding are preserved. Dashboard routes continue to the existing live app, with their current styling.

## Review locally

Run `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` in this folder, or use `sites-preview start "$PWD"`.

- `/`: refined entry page.
- `/baseline.html`: original public build-output snapshot.
- `/responsive.html`: current/refined 390px iframe comparison.
- `preview.jpg`, `desktop-comparison.jpg`, `mobile-comparison.jpg`: browser captures.
- `design-qa.md`: verification and limitations.

This folder is not wired into a production build. No dependency installation is needed for its local review server.
