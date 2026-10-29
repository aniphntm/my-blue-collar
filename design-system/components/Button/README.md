# Button

Three buttons: **primary** (accent fill, `c-on-accent` label), **secondary** (outlined in `c-border-mid`, the nav Join) and **text** (a quiet link CTA, accent for the highlighted tier). Hand-written from `components/hero.tsx`, `nav.tsx`, `pricing.tsx` and `waitlist-form.tsx`.

**You provide:** the label as children and `href` for links. Labels are verbs or destinations in sentence case, with an optional trailing arrow ("Join", "Start free", "Get notified").

**Do**
- Use one primary per view, for the thing the page is for.
- Use `block` for a form submit; set `disabled` while submitting and say so ("Sending…").
- Keep `radius-card` (8px).

**Don't**
- Don't write "Start free" while the product is a waitlist; the source's pricing card does, and your own UI/UX spec says to use accurate waitlist copy until launch gates pass.
- Don't rely on the visual size for the hit area: a transparent `::before` extends every button to at least 44px (`touch-min`), which the source's 29px nav button lacks.
- Focus is a 2px `c-accent` ring with a 2px offset (an addition; the source uses the browser default).
