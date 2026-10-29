# Eyebrow

The mono, uppercase label that sits above every section head and card: 11px, `.08em`, weight 500, `font-mono`. Hand-written from `.eyebrow` and `.rule-line` in `app/globals.css`.

**You provide:** short text with ` · ` and `→` as separators ("FREE · NOT A TRIAL", "01 — The platform"). Text-transform is applied for you.

**Do**
- Use `faint` on `c-bg` and `c-surface`; use `mut` on `c-bg-alt`, where `c-text-faint` measures 4.39:1 in light and misses AA.
- Use `accent` for a single live status ("Available now"), never for decoration.
- Use `panel` or `panel-soft` on `c-panel` surfaces.
- Use `variant="rule"` for the lighter footer line on cards ("RULE → one job, one thread").

**Don't**
- Don't set body copy in it, and don't go below 11px.
- Don't number sections you don't render in order; the source skips numbers where a band has no eyebrow.
