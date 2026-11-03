import Stripe from "stripe";
import { guarded, json, recordReceipt } from "@/lib/payments/server";
import { RailError, stripeMode } from "@/lib/payments/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return guarded(async () => {
    const { key, live } = stripeMode();
    const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!secret) throw new RailError(503, "Webhook is not configured.");
    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new RailError(400, "Missing signature.");
    let event: Stripe.Event;
    try { event = new Stripe(key).webhooks.constructEvent(await request.text(), signature, secret); }
    catch { throw new RailError(400, "Invalid webhook signature."); }
    if (event.livemode !== live) throw new RailError(400, "Wrong payment environment.");
    if (!event.account) return json({ received: true, ignored: true });
    await recordReceipt({ provider: "stripe", event_id: event.id, scope: event.account,
      event_type: event.type, object_id: "id" in event.data.object ? event.data.object.id : null, live });
    return json({ received: true });
  });
}
