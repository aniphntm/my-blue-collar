import { createAdminClient } from "@/lib/supabase/admin";
import type { BankOnboardingView } from "@/lib/bank-onboarding";
import { readAttempt, viewFor } from "@/lib/server/plaid/attempts";

export const runtime = "nodejs";

// Lets the wallet restore bank state after a refresh. Returns masked metadata only, and only to the cookie holder.
export async function GET() {
  let supabase;
  try { supabase = createAdminClient(); } catch {
    return Response.json({ status: "none" } satisfies BankOnboardingView);
  }
  const attempt = await readAttempt(supabase);
  return Response.json(attempt ? await viewFor(supabase, attempt) : ({ status: "none" } satisfies BankOnboardingView));
}
