import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

export const runtime = "nodejs";

function plaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = process.env.PLAID_ENV ?? "sandbox";
  if (!clientId || !secret || environment !== "sandbox") return null;
  return new PlaidApi(new Configuration({ basePath: PlaidEnvironments.sandbox, baseOptions: { headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret } } }));
}

export async function POST() {
  const client = plaidClient();
  if (!client) return Response.json({ error: "Add PLAID_CLIENT_ID and PLAID_SECRET for Plaid Sandbox testing." }, { status: 503 });
  try {
    const response = await client.linkTokenCreate({ user: { client_user_id: "bluework-test-user" }, client_name: "Bluework Test Wallet", products: [Products.Auth], country_codes: [CountryCode.Us], language: "en" });
    return Response.json({ linkToken: response.data.link_token });
  } catch {
    return Response.json({ error: "Plaid Sandbox could not start a bank sign-in." }, { status: 502 });
  }
}
