# Telnyx messaging webhooks

Endpoint: `https://mybluework.com/api/webhooks` (POST, standard JSON).
Messaging profile: set the primary standard webhook URL to this endpoint. Leave
failover and MM7 URLs empty unless independently configured. No outbound SMS is
sent by this receiver.

The handler verifies Ed25519 over the original body and timestamp, enforces a
five-minute replay window, accepts message.received/message.sent/message.finalized,
and stores the event before returning 200. Retries deduplicate by data.id. Storage
failures return 503. Payloads are never written to application logs. There is no
public inbox reader; stored events are accessible through the database admin.
MMS media URLs are stored, but the receiver does not download attachments.

Server configuration: TELNYX_PUBLIC_KEY, TELNYX_DATABASE_URL,
TELNYX_DATABASE_PUBLISHABLE_KEY, TELNYX_INBOX_SECRET. The last credential is a
random, server-only token granting access to the insert-only inbox RPC. Its hash
is embedded in the migration. To rotate it, update the function's expected hash
and server environment together. Never place the secret in a client variable.

Apply supabase/migrations/20261108235500_telnyx_webhook_events.sql to the configured
Supabase project. RLS blocks direct anonymous/authenticated table access; only
the credential-checked RPC can insert. The function retains the first event for
each ID, preserving out-of-order delivery records without overwriting state.

The Vercel domain-level redirect for mybluework.com must be unset. next.config.ts
preserves the website redirect while exempting the exact /api/webhooks path.
Use the exact URL without a trailing slash.

Checks: node --experimental-strip-types --test tests/telnyx-webhook.test.mjs;
npx tsc --noEmit; npx eslint lib/telnyx-webhook.ts app/api/webhooks/route.ts.
A true Telnyx end-to-end check requires a signed event from the configured account.
