# SectionHead

An eyebrow, a two-line h2 at 36px (48px from 640px) with `-0.022em` tracking and `text-wrap: balance`, and an optional lede in `c-text-3`, capped at 42rem. Hand-written from `components/section-head.tsx`.

**You provide:** the headline as children (break it with `<br />` into two short lines), an optional `index` eyebrow and an optional `lede` sentence.

**Do**
- Keep headlines to two short declaratives: "Your work, / all in one thread."
- Put one SectionHead per band, then a 64px gap (`space-16`) before the content.
- Pass `eyebrowTone="mut"` when the band is `c-bg-alt`.

**Don't**
- Don't add a second heading level inside it, or a button.
