import { createPublicKey, verify } from "node:crypto";

type Config = { publicKey?: string; databaseUrl?: string; databaseKey?: string; inboxSecret?: string };
const MAX_BYTES = 1024 * 1024;
const TYPES = new Set(["message.received", "message.sent", "message.finalized"]);
const reply = (status: number, message: string) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function receiveTelnyx(
  request: Request,
  config: Config,
  send: typeof fetch = fetch,
  now = Date.now(),
) {
  if (!config.publicKey || !config.databaseUrl || !config.databaseKey || !config.inboxSecret) {
    return reply(503, "Webhook configuration incomplete");
  }
  const timestamp = request.headers.get("telnyx-timestamp") ?? "";
  const signature = request.headers.get("telnyx-signature-ed25519") ?? "";
  if (!/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 || !signature) {
    return reply(401, "Invalid webhook signature");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return reply(415, "Expected application/json");
  }
  // Bound streamed bodies too; Content-Length is not trustworthy.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) {
          await reader.cancel();
          return reply(413, "Webhook too large");
        }
        chunks.push(value);
      }
    } catch {
      return reply(400, "Unreadable webhook");
    } finally {
      reader.releaseLock();
    }
  }
  const body = Buffer.concat(chunks);
  let key;
  try {
    const rawKey = Buffer.from(config.publicKey.trim(), "base64");
    if (rawKey.length !== 32) throw new Error("Invalid public key");
    key = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), rawKey]),
      format: "der", type: "spki",
    });
  } catch {
    return reply(503, "Webhook configuration incomplete");
  }
  const sig = Buffer.from(signature, "base64");
  if (sig.length !== 64 || !verify(null, Buffer.concat([Buffer.from(`${timestamp}|`), body]), key, sig)) {
    return reply(401, "Invalid webhook signature");
  }
  let event;
  try { event = JSON.parse(body.toString("utf8")); }
  catch { return reply(400, "Invalid JSON"); }
  const data = event?.data;
  if (!data || typeof data.id !== "string" || !data.id || data.id.length > 200 ||
      typeof data.event_type !== "string" || typeof data.occurred_at !== "string" ||
      !Number.isFinite(Date.parse(data.occurred_at)) || !data.payload ||
      typeof data.payload !== "object" || Array.isArray(data.payload)) {
    return reply(400, "Invalid event envelope");
  }
  if (!TYPES.has(data.event_type)) return reply(200, "Ignored event type");
  try {
    const saved = await send(`${config.databaseUrl.replace(/\/$/, "")}/rest/v1/rpc/receive_telnyx_event`, {
      method: "POST",
      headers: {
        apikey: config.databaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_secret: config.inboxSecret, p_event: event }),
      signal: AbortSignal.timeout(1500),
    });
    if (!saved.ok) return reply(503, "Event storage unavailable; retry delivery");
  } catch {
    return reply(503, "Event storage unavailable; retry delivery");
  }
  return reply(200, "Received");
}
