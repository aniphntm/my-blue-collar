# Nav UI/UX polish animations — design

## Context

`components/nav.tsx` is a sticky pill nav (logo, 3 links, "Join Beta" CTA) with no motion at all today — hover states are instant color swaps, there's no entrance treatment, and the pill looks identical whether the page is at the top or scrolled far down. This spec covers adding simple, CSS-driven polish animations to make the nav feel more alive, without pulling in an animation library. A mobile hamburger menu was considered but is out of scope for this pass — the nav's responsive/mobile behavior is unchanged.

## Scope

Three pieces, all contained to `components/nav.tsx` and a few `@keyframes`/utility additions in `app/globals.css`:

1. **Hover/press micro-interactions**
   - Nav links (`Features`, `Pricing`, `FAQ`): replace the instant `hover:text-ink` with a smooth color transition (`transition-colors duration-200`) plus an animated underline that scales in from the center on hover (`::after` pseudo-element, `scale-x-0` → `scale-x-100`, transform-origin center).
   - Logo (`MyBlueCollar` wordmark + badge): add `transition-transform duration-200` with a slight `hover:scale-[1.03]` on the badge only, so it reads as tappable without moving the whole lockup.
   - CTA ("Join Beta"): keep the existing `hover:bg-brand-dark`, add `transition-all duration-200` and `active:scale-95` for a press-down tactile effect.

2. **Entrance animation**
   - On first mount, the whole pill fades in and slides down ~8px (`fadeSlideDown` keyframe, ~400ms ease-out, runs once — no replay on re-render or scroll).
   - Implemented as a plain CSS animation applied via a class on the `<nav>` element; no JS/state needed for this part.

3. **Scroll-triggered shrink**
   - Requires `Nav` to become a client component (`"use client"`) since it needs a scroll listener.
   - A passive `scroll` event listener sets a boolean `scrolled` state once `window.scrollY` passes a ~24px threshold (with hysteresis-free single threshold — no debounce/throttle needed at this scale).
   - When `scrolled` is true: vertical padding on the pill tightens slightly (`py-2.5` → `py-1.5`) and the shadow deepens a bit. Both transition smoothly via `transition-all duration-300` already present from the hover work.
   - Listener is registered/cleaned up in a `useEffect`, using `{ passive: true }`.

## Non-goals

- No mobile hamburger menu / responsive nav changes (separate future task).
- No animation library (Framer Motion etc.) — Tailwind transitions + hand-written `@keyframes` only.
- No changes to nav content, links, or layout structure.

## Testing

Manual verification in the browser (`next dev`):
- Hover each link and the CTA — confirm smooth underline/color/scale transitions, no jank.
- Reload the page — confirm the pill fades/slides in once on load.
- Scroll down past ~24px and back up — confirm the pill shrinks and un-shrinks smoothly, and doesn't jitter right at the threshold.
- Quick resize check to confirm nothing regresses at common viewport widths (this pass doesn't touch responsive layout, but worth a sanity check).