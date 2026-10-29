import { Configuration, PlaidApi, PlaidEnvironments, Products } from "plaid";

// Sandbox is the only supported environment: the wallet spec forbids real money movement until the launch gates pass.
export const PLAID_ENVIRONMENT = "sandbox" as const;

export function plaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = process.env.PLAID_ENV ?? PLAID_ENVIRONMENT;
  if (!clientId || !secret || environment !== PLAID_ENVIRONMENT) return null;
  return new PlaidApi(new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: { headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret } },
  }));
}

// Link products. Identity Match is requested as optional so institutions without it still link;
// ownership then lands in manual review instead of auto-verifying (see ownership.ts).
// UNVERIFIED against current Plaid docs (plaid.com was unreachable when this was written): confirm
// that identity_match belongs in optional_products and not products/additional_consented_products.
export const LINK_PRODUCTS = [Products.Auth];
export const LINK_OPTIONAL_PRODUCTS = [Products.IdentityMatch];

// Plaid errors are axios errors; log only the provider code, never request or response bodies.
export function plaidErrorCode(error: unknown) {
  const code = (error as { response?: { data?: { error_code?: unknown } } })?.response?.data?.error_code;
  return typeof code === "string" ? code.slice(0, 64) : "UNKNOWN";
}
