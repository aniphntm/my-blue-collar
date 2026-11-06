# DarkPanel

The dark inset panel used beside the hero: a `c-panel` surface with a `c-panel-border` hairline, an eyebrow header and numbered steps. Hand-written from `components/hero.tsx`.

**You provide:** `title`, an optional `tag` (say "Illustrative" when it is) and `steps` of `{n, title, note}`.

**Do**
- Use `c-panel-text`, `c-panel-soft` and `c-panel-faint` for its text tiers; all pass AA on the panel.
- Keep it to four steps.

**Don't**
- Don't rely on the shade to separate it from the page in the dark theme: `c-panel` is `#14100c` on a `#131109` page, 1.0:1. The hairline border and shadow are what show it; consider a lighter panel tone for dark.
