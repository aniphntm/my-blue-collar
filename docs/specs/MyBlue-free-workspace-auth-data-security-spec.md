# MyBlue free workspace — auth and data security spec

Status: proposed implementation requirements; September 8, 2026. This is not a completed security audit or compliance certification.

## Baseline and scope

The September 8 audit reports no identified workspace schema/onboarding and zero Auth users in the inspected Supabase project. Existing public tables having RLS does not demonstrate isolation for a future workspace. This spec covers collaboration identity, tenancy, invitations, files and operations. Treasury, casino and hiring data have separate authorization boundaries and must not become visible through workspace membership.

## Identity and sessions

Use Supabase Auth, with verified email one-time sign-in as the lean default; choose a properly configured transactional sender. Allowlisted production and preview redirect destinations prevent open redirects. Validate return paths rather than accepting arbitrary URLs. Keep application sessions in the framework-supported secure server/browser arrangement; verify the authenticated user server-side for every protected operation, and follow current provider guidance at implementation time. A browser-supplied user ID or workspace ID is never authorization.

Enforce HTTPS and secure cookie settings appropriate to the session implementation. Protect cookie-authenticated mutations against cross-site requests, and allow only intended origins. Rate-limit sign-in, resend, invitation and public capture actions. Use generic authentication errors where appropriate to avoid account enumeration. Require recent authentication for ownership transfer, workspace deletion and credential changes. Require stronger authentication for privileged administration before opening broad access; define the recovery process as part of rollout.

## Authorization model

| Role | Rights |
| --- | --- |
| Owner | Admin rights plus ownership transfer, export and workspace deletion |
| Admin | Manage workspace content, invitations and membership; cannot remove the last owner |
| Member | Read workspace-visible content; create Threads/messages; edit own messages; no role or connection management |
| Anonymous / pending invite | No workspace content access |

MVP content is visible to all active workspace members. No guest or private-Channel promise is made. Granting private visibility later requires new database policies, search filtering and explicit semantics for Threads linked across Channels.

A workspace is the tenant. Every content row carries `workspace_id`; membership is checked by database policies as well as server operations. Use `huddle_channels` and `channel_threads` with same-tenant foreign-key/constraint enforcement, preventing a valid local link from referencing a different tenant. Linking a Thread never changes its tenant or bypasses membership. Search, counts, exports and file metadata must honor the same rules.

Apply RLS to all tenant tables and storage access; validate both existing-row access and proposed-row values on updates/inserts. User-facing requests should use the authenticated user's scope. A service-role credential bypasses RLS and remains server-only; exceptional privileged operations must perform explicit membership/role validation and log the action. Never expose it through public environment variables.

## Membership and invitations

Store single-use, expiring invite token hashes, target workspace, normalized invited email, inviter and intended role. Acceptance requires a verified identity matching the invited email and an atomic consume-plus-membership transaction. Proposed expiry: seven days. Resending invalidates the previous token; duplicates do not create duplicate memberships. Role assignment cannot exceed inviter authority. Reject expired/revoked invites and preserve the last owner invariant transactionally.

Membership removal blocks subsequent database/file authorization immediately through live membership checks. Already-issued signed file URLs remain valid until expiry, so use short expiry and document that limit. Test stale sessions after removal; UI logout alone is insufficient.

## Data handling and operations

- Private attachment storage only. Validate size and detected type, use non-executable delivery/content disposition, and prevent path traversal. Consider malware scanning before expanding to unrestricted uploads. Proposed file limit: 10 MB; initial allowlist: PDF, JPEG, PNG and plain text.
- Escape rendered message text; sanitize any future rich HTML. Never render raw uploaded HTML inline.
- Keep credentials in managed server secrets; restrict production access and separate development/test data and credentials.
- Record role changes, invitations, exports, deletion and connection changes with actor/time/object/result. Redact credentials, tokens and message bodies from logs and analytics.
- Provide owner export of authorized workspace data. Account deletion must handle ownership transfer; deleting one user must not silently destroy shared company records.
- Define a documented deletion queue and retention schedule before launch. Proposed target: remove live content within 30 days of confirmed workspace deletion; backups age out under the selected backup retention. Validate feasibility before promising this externally.
- Verify actual backup availability/retention for the selected plan, perform one restore rehearsal, and document incident contact, credential rotation and service-disable procedures.

## Release acceptance gates

1. Two distinct workspaces: user A cannot read/write/delete/search/export user B's records, including guessed IDs and direct API calls.
2. Cross-tenant join rows, workspace-ID reassignment and membership self-escalation fail at the database layer.
3. Removed member with an existing session loses access; revoked, replayed and wrong-email invites fail.
4. Anonymous requests cannot enumerate members/content/files; service credentials are absent from client bundles and logs.
5. CSRF/origin checks, redirect allowlists and throttling behave as designed; upload type/size checks reject unsafe input.
6. Last-owner removal is rejected; authorized transfer is atomic and auditable.
7. A representative backup is restored successfully; export and deletion behavior match documented scope.

## Decisions and limits

Confirm production Supabase binding, launch geography/data region, retention policy, privileged MFA/recovery method and free storage limits. These are configuration and product decisions still open. No legal compliance claim is implied. Private Channels, enterprise SSO, SCIM and customer-managed encryption are deferred; tenancy and privileged-access controls are not.

Sources: September 8 audit, local Supabase client/admin modules and the user's collaboration model. Implementation must verify current official Supabase/Next.js session and policy guidance; this document specifies desired behavior, not version-specific API calls.
