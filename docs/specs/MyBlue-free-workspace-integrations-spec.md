# MyBlue free workspace — integrations spec

Status: proposed MVP; September 8, 2026. This specifies future work, not deployed capability.

## Goal and evidence

Enable a new operator to create a persistent workspace, organize work and collaborate without buying or connecting another product. Integrations support that loop; they must not block it.

The September 8 audit found a marketing/waitlist flow, static job threads and no identified workspace schema or onboarding. Local source includes Next.js 16, React 19 and Supabase client dependencies, plus a lead form and separate hiring/payment surfaces. Existing Bluework customer-app design covers money, not this collaboration workspace. Reuse the brand, not its balance-first information architecture.

## MVP integration contract

| Dependency | Minimum capability | Boundary and failure behavior |
| --- | --- | --- |
| Supabase Auth | Verified sign-in and invitation acceptance | Identity is separate from business membership; see security spec. |
| Supabase database | Persist workspaces, memberships, Huddles, Channels, Threads, messages and link records | All work and relationship records belong to one workspace; unauthorized requests fail closed. |
| Private file storage | Upload, view and delete a small attachment | Membership checked before access; private bucket, short-lived URLs, MIME/size validation. Proposed limit: 10 MB per file. |
| Transactional email | Sign-in, invitation and recovery messages | Choose/configure one sender with domain verification; report delivery failures and support resend throttling. No marketing subscription implied. |
| Acquisition handoff | Landing CTA → sign-in → onboarding → first saved Thread | Preserve permitted source/medium/campaign in an allowlisted, bounded format. Do not carry secrets or personal data in URLs. |
| Product measurement | Signup completed, workspace created, first Thread saved, collaborator joined | Generate success events after persistence; use event IDs to deduplicate. No message bodies, attachments or email addresses in analytics. |

No Stripe, Plaid, wallet or casino account is required to use the free workspace. Do not copy financial or hiring records into collaboration tables.

## Data and event model

A workspace is the tenant. `workspace_members` links authenticated users and roles. `huddle_channels` implements Huddles ↔ Channels; `channel_threads` implements Channels ↔ Threads. Each join row and both endpoints must have the same workspace ID. A Thread has one identity and message history even when linked to several Channels. A Huddle is an organizing group in this MVP; live audio is deferred.

Persist mutations before emitting activation events. Creation endpoints accept idempotency keys so retries cannot create duplicate workspaces, Threads or invitations. Database constraints enforce uniqueness; the browser does not own this guarantee. Activity records retain actor, workspace, action, object and timestamp without duplicating content.

A minimal integration settings page shows connection status, scope, last success and a retry/disconnect action where meaningful. Only owners/admins manage external connections. Future OAuth credentials must live server-side, scoped to a workspace and authorized connecting user; never in browser state or analytics.

## Later, only after core activation works

1. Google Drive: attach selected file links using least-privilege consent; do not bulk-import a Drive. A link grants no external file permission.
2. Calendar: explicit event creation from a work item, then optional two-way sync if demanded.
3. Accounting/payment references: link an authorized operator record; never infer access from collaboration membership.
4. Generic webhooks, CRM and bulk migration: add signed delivery, replay protection, retries and dead-letter review when those connectors ship.

Avoid building a connector marketplace or full Slack/Google history migration for launch. Manual links plus CSV export are sufficient first substitutes.

## Acceptance criteria

- A fresh account creates a workspace and saved Thread without any external account connection.
- Reload and a second authorized session show the same persisted Thread.
- A Thread linked to two Channels has one history; edits appear through both entry points.
- Repeated submission with the same key creates one object and one activation event.
- Email/storage interruption provides a recoverable state; no false success confirmation.
- Tagged inbound journey retains allowed attribution through activation; direct traffic is represented honestly as unknown/direct.
- Unauthorized workspace and file access is denied, including forged relationship IDs.

## Decisions before implementation

Choose the canonical workspace hostname, email sender and initial file/storage quota. Determine analytics consent/retention by launch geography before enabling optional tracking. Proposed defaults: no external connector requirement, manual file links before Drive OAuth, and owner-controlled CSV/JSON export. Free seat and total-storage limits remain product decisions; do not display invented limits.

Sources: local September 8 audit; `my-blue-collar/package.json`, `components/waitlist-form.tsx`, `components/job-threads.tsx`; user-specified Huddles/Channels/Threads model. Runtime/vendor APIs must be checked against current official documentation during implementation.
