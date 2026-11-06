# Nav

The sticky top bar: product name, a few in-page links, and one outlined Join button, set on `c-nav-bg` over a backdrop blur with a `c-border-soft` bottom rule. Hand-written from `components/nav.tsx`.

**You provide:** the product name (`brand`), optional mono suffix, up to four `links`, and one `cta`. Pass `skipTo="#main"` so a skip link is the first tab stop (an addition: the source has none). Use `logoSrc` only on light themes; the wordmark's deep blue end drops to about 2.8:1 on the dark ground.

**Do**
- Keep the bar at 3.5rem (`nav-height`) and the content at `page-max` with a 24px gutter.
- Keep links to destinations on the same page; the label is the section name ("Platform", "Flow", "Pricing", "FAQ").

**Don't**
- Don't hide every link below 640px with nothing in its place. The source does (only "Join" remains on phones); add a disclosure menu when there are more than two destinations.
- Don't add a second primary action to the bar.
