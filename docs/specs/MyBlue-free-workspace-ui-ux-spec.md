# MyBlue free workspace — basic UI/UX spec

Status: proposed MVP; September 8, 2026. No implementation or usability test is claimed.

## Outcome

A new operator can sign in, create a workspace, save a first work Thread, invite a colleague and return to their work. The free product must deliver that loop before its CTA promises immediate access. Existing source/audit shows a waitlist and static job-thread examples, so onboarding and persistence are new work.

## Information architecture

| Surface | User purpose | Minimum contents |
| --- | --- | --- |
| Home | Resume work | Recent Threads, unread activity, one create action |
| Work | Find the right conversation | Huddles, Channels, search and recent Threads |
| Thread | Coordinate one piece of work | Title, messages, attachments and linked Channels |
| Workspace settings | Manage the business | Members, invitations, integrations, export and account/security links |

Desktop: workspace switcher and compact navigation rail, list pane, content pane. Mobile: Home/Work/Settings navigation; list and Thread become separate screens with predictable back behavior. Do not cram three desktop panes onto a phone.

The model is a graph with a familiar navigation path: Huddles organize Channels; Channels organize Threads. A Channel may appear in multiple Huddles and a Thread in multiple Channels. Show “Also in…” links and a link-management action. Breadcrumbs represent the current entry path, not exclusive ownership. Linking adds a reference; it never duplicates messages. Huddles are groups here, not audio calls.

## First-use flow

1. Landing “Start free” leads to sign-in while retaining allowed attribution. Until launch gates pass, use accurate waitlist copy instead.
2. Verify email; preserve the intended destination through verification.
3. Create workspace with name only. Business type and phone are optional; no bank or wallet step.
4. Create a first Huddle and Channel using editable defaults such as Operations / General.
5. Prompt for a first Thread: title plus optional first message. Show a real saved confirmation and open the Thread.
6. Offer invitation by email, with Skip. Returning users resume Home; invitees accept the intended workspace invitation instead of creating another tenant.

Treat “first Thread saved” as initial activation; measure collaborator contribution separately. A job can be represented by a Thread; do not make every Thread a job or replace the many-to-many model with one rigid job hierarchy.

## Core interactions

- Create/link/archive Huddles and Channels; create/link/archive Threads; send/edit own messages; attach a file.
- Search accessible Thread titles and message content, with keyboard and touch entry points.
- MVP visibility is workspace-wide for members. Explain this near creation and invitation; private Channels and external guests are later work.
- Archive removes clutter without destroying history. Permanent deletion is a separate permissioned, confirmed action.
- Owner/admin member controls show invitation pending/expired/accepted states and role changes. Members cannot silently invite broader access.
- Show sending, saved, failed/retry and offline states. Keep unsent text in the active view during retry; do not claim offline support or silently queue destructive actions.
- No placeholder actions, fake counts or simulated balances in the usable workspace. Any demonstration content is labeled and separate from actual records.

## Visual and accessibility direction

Reuse existing MyBlue assets and design tokens after inspecting the current brand files. Use clear type, restrained borders, one primary blue action and one principal task per screen. Icons have accessible names; color never carries status alone. Provide visible focus, logical tab order, keyboard-operable menus, sufficient contrast and reduced-motion support. Aim for 44 px touch targets. Avoid gesture-only actions; swipe is optional enhancement. Use short, reversible transitions rather than motion on every navigation.

Design empty, loading, permission-denied, expired-session and network-error states alongside success. After session expiry, preserve safe in-memory draft text while reauthentication returns the user to the same context. Do not persist sensitive drafts indefinitely in local storage.

## Acceptance criteria

- On phone and desktop, a new user completes account → workspace → saved Thread without help or a required integration.
- Reload and sign-in on another device return persisted work; back navigation preserves the user's context.
- Linking the same Channel to two Huddles and Thread to two Channels remains understandable and edits one underlying object.
- Every visible control has a working action or clearly explained disabled state.
- Keyboard-only flow reaches all primary functions; focus returns sensibly after dialogs; reduced motion is respected.
- Failed submissions retain input and expose retry; success appears only after storage confirms it.
- Invitations and membership removals produce accurate UI states and access behavior.

## Later and open decisions

Defer audio/video Huddles, private Channels, external guests, rich document editing, deep task management and native apps. Confirm primary pilot workflow and vocabulary with one operator before broadening. Confirm canonical hostname and free limits; hide pricing/upgrade mechanics until real limits exist. The money-oriented Bluework customer-app spec remains a separate product surface.

Sources: September 8 audit; local job-thread and waitlist components; existing Bluework customer-app design; user-specified collaboration model. These are design requirements, not proof of present capability.
