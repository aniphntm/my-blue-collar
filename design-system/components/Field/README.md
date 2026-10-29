# Field

A labelled input or select: a 13px label above, a 44px control on `c-surface` with a `c-border-control` boundary (3:1 or better), an accent focus ring, optional hint and an error announced with `role="alert"`. Adapted from the `fieldClasses` in `components/waitlist-form.tsx`.

**You provide:** `label` and `name`; add `options` for a select, `required`, `hint` and `error`. Pass `autoComplete` tokens for name, email and tel.

**Do**
- Keep the label visible. The source's waitlist form relies on placeholders, which disappear on input and are not reliable names for assistive tech.
- Write errors that say how to fix it: "Enter a 10-digit phone number, like 555-010-0123."
- Use 16px control text on phones; the source's 14px makes iOS zoom on focus.

**Intentional additions (not in the source):** visible labels, a "(required)" marker, `c-border-control` in place of `c-border`, the 2px focus ring, and the 44px minimum height.
