# PricingTier

A pricing cell: name, a badge eyebrow, a one-line description, an arrow-bulleted feature list and a text CTA pinned to the foot. Hand-written from `components/pricing.tsx`.

**You provide:** `name`, `badge`, `desc`, `features`, `cta` and `href`. Set `highlighted` on one tier only; it turns the badge and CTA accent.

**Do**
- Make the badge say what is true today: "Coming soon" for Pro and Network.
- Keep tier features to four.

**Don't**
- Don't badge a waitlist as "Available now" or word its CTA "Start free". The source does both for the Free tier; this preview corrects them to "Beta, waitlist" and "Join the waitlist".
