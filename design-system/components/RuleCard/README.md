# RuleCard

One cell of a hairline grid, wrapped in `RuleGrid` (1px gaps over a `c-border` field, three columns from 768px, one below): an eyebrow, an h3 at 24px, a body paragraph in `c-text-3`, and an uppercase "RULE →" footer pinned to the bottom. Hand-written from `components/problems.tsx`.

**You provide:** `title`, body as children, and optional `eyebrow` and `rule`. The card fills its grid cell on `c-bg` with 32px padding.

**Do**
- State a promise you keep, then the rule that backs it: "Free stays free" / "RULE → the essentials never go behind a paywall".
- Keep bodies to two sentences so the footers line up.

**Don't**
- Don't use shadows or radii on a RuleCard; the grid's hairlines are the surface.
