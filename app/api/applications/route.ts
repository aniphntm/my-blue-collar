import { createAdminClient } from "@/lib/supabase/admin";
import { parseApplication, requestFingerprint } from "@/lib/applications";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot fields are hidden from people but commonly completed by bots.
  if (body.companyWebsite || body.faxNumber) {
    return Response.json({ ok: true }, { status: 202 });
  }
  const input = parseApplication(body);
  if (!input) return Response.json({ error: "Please review the required fields." }, { status: 400 });

  let supabase;
  try { supabase = createAdminClient(); } catch {
    return Response.json({ error: "Applications are not configured yet." }, { status: 503 });
  }

  const fingerprint = requestFingerprint(request);
  if (fingerprint) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase.from("applications").select("id", { count: "exact", head: true })
      .eq("request_fingerprint", fingerprint).gte("created_at", since);
    if ((count ?? 0) >= 3) return Response.json({ error: "Please try again later." }, { status: 429 });
  }

  const { data: existing } = await supabase.from("candidates").select("id").ilike("email", input.email).maybeSingle();
  let candidateId = existing?.id as string | undefined;
  if (!candidateId) {
    const { data, error } = await supabase.from("candidates").insert({
      full_name: input.fullName, email: input.email, phone: input.phone, location: input.location,
    }).select("id").single();
    if (error) return Response.json({ error: "We could not save your application." }, { status: 500 });
    candidateId = data.id;
  } else {
    await supabase.from("candidates").update({
      full_name: input.fullName, phone: input.phone, location: input.location, updated_at: new Date().toISOString(),
    }).eq("id", candidateId);
  }

  const { error } = await supabase.from("applications").insert({
    candidate_id: candidateId,
    role_interest: input.track,
    work_background: input.workBackground,
    linkedin_url: input.linkedInUrl,
    portfolio_url: input.portfolioUrl,
    consent_to_contact: true,
    consented_at: new Date().toISOString(),
    request_fingerprint: fingerprint,
  });
  if (error) return Response.json({ error: "We could not save your application." }, { status: 500 });
  return Response.json({ ok: true }, { status: 201 });
}
