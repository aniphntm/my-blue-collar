import { receiveTelnyx } from "@/lib/telnyx-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return receiveTelnyx(request, {
    publicKey: process.env.TELNYX_PUBLIC_KEY,
    databaseUrl: process.env.TELNYX_DATABASE_URL,
    inboxSecret: process.env.TELNYX_INBOX_SECRET,
    databaseKey: process.env.TELNYX_DATABASE_PUBLISHABLE_KEY,
  });
}
