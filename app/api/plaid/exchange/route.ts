import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export const runtime = "nodejs";

function plaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = process.env.PLAID_ENV ?? "sandbox";
  if (!clientId || !secret || environment !== "sandbox") return null;
  return new PlaidApi(new Configuration({ basePath: PlaidEnvironments.sandbox, baseOptions: { headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret } } }));
}

export async function POST(request: Request) {
  const client = plaidClient();
  if (!client) return Response.json({ error: "Plaid Sandbox is not configured." }, { status: 503 });
  const body = (await request.json()) as { publicToken?: string };
  if (!body.publicToken) return Response.json({ error: "Missing Plaid public token." }, { status: 400 });
  try {
    // This test-only flow validates the exchange but deliberately persists no banking credentials.
    await client.itemPublicTokenExchange({ public_token: body.publicToken });
    return Response.json({ connected: true });
  } catch {
    return Response.json({ error: "Plaid Sandbox could not complete the test link." }, { status: 502 });
  }
}
