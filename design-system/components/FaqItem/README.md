# FaqItem

A disclosure row: a 17px question button with a mono +/− on the right, and an answer paragraph in `c-text-3` capped at 42rem. Hand-written from `components/faq.tsx`; adds `aria-controls` and keeps the panel in the DOM with `hidden`.

**You provide:** `question`, the answer as children and optionally `defaultOpen`. For an accordion, pass `open` and `onToggle` from the parent (the source opens the first item and closes the previous one).

**Do**
- Wrap the list in a `c-border` top rule; each item draws its own bottom rule.
- Answer in the first sentence: "Yes. Scheduling, customers, invoicing…".

**Don't**
- Don't put links the visitor must find inside a collapsed answer.
