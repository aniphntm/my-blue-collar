# MyBlue Financial — motion & interaction system

Version 1 · October 15, 2026 · Proposed standard with a working local prototype.

**Motion makes a decision, location, or result easier to understand.** MyBlue should feel composed, responsive, and under the visitor's control. The signature is a short blue underline, a small vertical settle, and a clear end state.

## Basis and scope

Inspected the live [mybluefinancial.com](https://mybluefinancial.com/) and its local HTML counterpart on October 15. The current page has three section links, six principles, a three-network tab group, token disclosures, copy actions, and a theme toggle. Its navigation currently removes URL fragments after navigation.

The production HTML in `public/coin/` extends that page. Publishing this source to GitHub does not establish a production deployment. The latest local landing-page copy, imagery, and token information are retained; this motion work does not newly verify financial claims. Planned financial tools remain described as coming soon. This system changes interaction behavior, not the product roadmap or token economics.

Source files in `public/coin/`: `index.html` is the functional page; `motion.css` owns the tokens and component styles; `motion.js` owns navigation, orchestration, and interruption. Review-only controls are omitted. The root MyBlue Financial host is mapped to this HTML by `next.config.ts`; `/coin` provides a direct preview on other hosts.

## Motion vocabulary

| Token | Value | Purpose |
| --- | --- | --- |
| `--motion-press` | 80ms | Acknowledge pointer pressure |
| `--motion-fast` | 140ms | Network panel, status, theme color |
| `--motion-ui` | 220ms | Navigation underline, mobile menu, disclosure |
| `--motion-enter` | 360ms | First arrival and section introduction |
| `--motion-stagger` | 40ms | Separate related hero elements; cap total delay at 120ms |
| `--motion-ease-out` | `cubic-bezier(.16,1,.3,1)` | Arrive quickly and settle gently |
| `--motion-ease-in` | `cubic-bezier(.4,0,1,1)` | Reserved for future dismissals |
| `--motion-ease-move` | `cubic-bezier(.4,0,.2,1)` | Reserved for future positional changes |

Movement distances: 1px for press, 3px for a CTA arrow, 4px for replaced content, 8px for the menu, 12px for entrance. No bounce or overshoot. Every interaction is available immediately; the animation never delays its data update or click handler.

Use transform and opacity for decorative motion. Measured height is permitted only for user-requested disclosure expansion. Color changes are short and limited to affected surfaces. Avoid `transition: all`, permanent `will-change`, animated shadows, animated blur, token rotation, parallax, cursor followers, scroll hijacking, and looping decorative status lights.

## Navigation contract

| Mechanic | Behavior | Motion | Keyboard and state |
| --- | --- | --- | --- |
| Header | Remains visible at the top; constant height at each breakpoint. A subtle fixed shadow appears after 8px of scrolling | No header slide or resize | Does not take focus while scrolling |
| Section links | `ethos → #ethos`, `token terms → #token-terms`, `ecosystem → #building` | Native smooth scroll; browser-controlled duration | Focus destination with `preventScroll`, then scroll. Set `aria-current="location"` from visible section |
| Active link | Blue underline attached to the corresponding label; no selection when no linked section is current | Scale underline from left, 220ms | Location is also represented by `aria-current`; focus has its own visible outline |
| Mobile navigation | At ≤680px, Menu toggles an inline disclosure below the header controls | Enter from −8px, 220ms; close immediately | `aria-expanded`, `aria-controls`; Tab follows normal document order; Escape closes and returns focus to Menu |
| Mobile link selection | Close menu, measure the collapsed header, focus and navigate | No exit delay | Outside click closes; breakpoint changes cannot leave focus in hidden navigation |
| Destination offset | Reserve measured header height plus 24px | No independent motion | Heading remains visible beneath sticky header |
| Home and back to top | Navigate to `#main` | Same native scroll | Focus main content; never move keyboard focus on ordinary scrolling |

**Proposed behavior change:** retain meaningful hash URLs. User-activated section navigation pushes one history entry when the destination changes. Back/Forward restores section focus and position; a direct `#ethos` or `#token-directory` URL opens the right destination. Passive scrolling updates the underline only, without writing history or moving focus. Modified clicks retain native browser behavior.

The compact site does not need a modal navigation drawer: inline expansion keeps context and avoids a focus trap. Navigation stays visible if JavaScript fails. A modal drawer, if introduced later, would require a separate dialog specification.

## Component mechanics

### Arrival and scrolling

The headline, supporting copy, CTA, and token card settle upward by 12px while fading in over 360ms. Hero delays are capped at 120ms: the entire arrival completes within 480ms. Section introductions animate once on entering the viewport; scrolling back does not replay them. Ordinary body copy and risk/terms content remain available without a reveal prerequisite. Nothing is hidden in baseline CSS, so script failures cannot strand invisible content.

### Network tabs

Solana, Base, and Ethereum remain a single tab group. Selection updates `aria-selected`, roving `tabindex`, panel labeling, address, explorer URL, copy label, and explanatory text synchronously. Then the new panel settles by 4px over 140ms. Never animate addresses character by character or show an old address beside a newly selected network.

Left/Right wraps; Home/End selects first/last. Selection follows keyboard focus because content is already local. A fast second selection cancels the earlier animation: latest intent wins. Reserve explanatory space to limit jumps; permit growth for enlarged text. The network selector changes displayed information only.

### Disclosures

Use native `details` and `summary`. The six principles can be opened independently so visitors can compare them. Enter or Space activates summary. Measure current and target height; animate over 220ms. Rapid reversal starts at the current rendered height rather than restarting at an endpoint. Clear inline height after finishing so text reflow and zoom work. On closing, make the body inert immediately and remove `open` when the movement completes. No timed auto-collapse. Reduced motion switches state immediately.

Opening the token directory through a link must also open its disclosure. Keep token terms readable and selectable throughout. Opening a disclosure must not steal focus from its summary.

### Buttons, links, and feedback

Press shifts the button down 1px over 80ms; hover shifts a directional arrow 3px over 140ms on fine pointers only. Color and border feedback use 140ms. Underlined text and focus outlines remain distinct from hover. Primary and navigation controls use at least 44px targets.

Copy success appears only after the clipboard promise resolves. Use the existing nearby polite live region, reserve its space, and animate its message by 4px over 140ms. Keep the result visible until another attempt or network selection. On denied clipboard access, select the address or offer the existing download fallback. Never claim success from an animation finishing. Keep feedback local; no toast obscuring terms.

### Theme

Change the theme state and accessible label immediately; surfaces and text transition color in 140ms. Persist only the existing theme preference. No full-screen wipe or theme overlay. Initial theme selection runs before rendering; restoration does not play an entrance. Reduced motion applies the palette immediately.

## Accessibility and interruption

- Respect `prefers-reduced-motion` from the first frame and listen for changes during the session. The prototype's Reduced motion control may further reduce motion; it cannot override an OS request to reduce it.
- Reduced motion removes translation, stagger, smooth scrolling, height interpolation, and decorative fades. Navigation, feedback, selection, and final visibility remain intact.
- Cancel running Web Animations when reduced motion becomes active. Settle disclosures to their requested final states and clear temporary styles. Never depend on an animation event to make the interface usable.
- A new action supersedes an older one; do not queue clicks behind animations.
- Native links remain links, tabs remain tabs, disclosures remain native disclosures. Do not add menu/menuitem roles to website navigation.
- Preserve visible focus, zoom/reflow, text selection, and browser find. Do not communicate loading, success, or location through color alone.

## Future mechanics — specified, not in this prototype

| Pattern | Proposed behavior |
| --- | --- |
| Additional site routes | Keep the header mounted where the framework allows. Commit the destination and URL immediately, focus its main heading, optionally fade in over 140ms. Leave navigation usable during loading. Back restores saved scroll. Do not fade the old page out before requesting the next one |
| Async forms | `idle → submitting → success/error`; prevent duplicate submissions while pending, preserve values on error, show nearby text feedback, link errors to their inputs. No fake progress percentage or minimum loading delay |
| Loading | Reserve actual content space. Show a static loading label for longer waits; reduced motion uses the same label. An unresolved request remains pending regardless of how long an animation has run |
| Dialogs | Use native dialog semantics, a visible close action, Escape, focus containment, inert background, and focus return. Enter: 8px + opacity, 220ms; exit: opacity, 140ms; immediate reduced-motion state |
| Financial actions | Review, submission, pending, confirmed, and failed are distinct states. Only verified application responses may set confirmed. Monetary figures change atomically; no count-up, celebratory confetti, or decorative urgency |

## Integration and rollout

The source is integrated in `public/coin/` with absolute `/coin/` asset paths, so the domain root and `/coin` share one implementation. The existing hash-stripping handler is removed. Token selection, theme storage, and clipboard actions remain the source of truth. Prototype controls are absent and their listeners are optional.

`next.config.ts` maps the apex and www MyBlue Financial root to this static page before the app route and maps `/coin` to its HTML. Existing casino routing remains in place. Verify the checks below on the actual deployment before announcing a production release. A GitHub push alone is not deployment proof.

## Acceptance checks

- Desktop: each section link lands below the header, activates the right underline, changes the hash once, and focuses the destination. Back/Forward and direct links work.
- Mobile at 390px and 320px: no horizontal overflow; Menu opens; Escape restores focus; selecting a link closes it; crossing the breakpoint leaves no hidden focused link.
- Tabs: fast click/arrow sequences leave one selected tab and a matching address, explorer, label, and copy action. Home/End works.
- Disclosures: rapid open/close reversals finish correctly; text at 200% remains readable; directory deep links open the directory.
- Clipboard: success is tied to a real write; denial has a useful fallback; switching networks cannot show stale success.
- Reduced motion: enable before load and during an entrance or disclosure. Confirm final states remain correct with no interpolation.
- Failure: JavaScript unavailable still leaves anchors and native disclosures usable; first network details remain visible. Theme or clipboard storage errors do not break navigation.
- Performance: no animation-driven request loop; no visible animation-induced layout shift on load; no console errors from this system. Height layout work occurs only during a requested disclosure.

## Iteration after review

Judge three things: can visitors locate the right section, do network changes stay unambiguous, and does mobile navigation feel immediate? Change one token or behavior at a time, then replay the same action. Suggested first comparison: 220ms vs 180ms for disclosure movement. Record observed friction before adding more animation.

## Validation performed

Checked JavaScript syntax with `node --check`. In the Codex browser, verified section URL/focus/current-link behavior (ethos landed at 105px beneath an 81px header), repeated disclosure toggles, Base → Ethereum arrow-key selection with matching address and explorer, 390px mobile menu visibility, Escape focus return, directory opening through its link, and the reduced-motion control's label and pressed state. Exercised Back/Forward and a 320px layout. The page error-log query returned no errors. Browser-tool telemetry emitted unrelated network errors.

Still required before release: OS-level reduced-motion emulation, clipboard permission success/denial, JavaScript-disabled behavior, screen-reader review, 200% zoom, measured performance, and cross-browser checks. These are acceptance criteria, not claimed completed tests.

## Release validation

The Next.js production build and TypeScript check passed. Inline JavaScript syntax, external motion script syntax, unique HTML IDs, and local asset references passed. Local production HTTP checks returned 200 for the apex and www Financial root, `/coin`, CSS, JS, image, and manifesto. An unrelated MyBlue Work root check could not render because this clean checkout has no Supabase URL configured; `app/`, `components/`, and `lib/` are unchanged from the main branch. No production deployment is asserted by these checks.
