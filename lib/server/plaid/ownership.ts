// Account eligibility and ownership policy for bank onboarding. Pure so it can be tested without Plaid.
// The thresholds below are a placeholder policy: compliance owns the real numbers before any production use.
export const ELIGIBLE_SUBTYPES = ["checking", "savings", "cash management"] as const;
export type EligibleSubtype = (typeof ELIGIBLE_SUBTYPES)[number];

const VERIFY_AT_OR_ABOVE = 85;
const REJECT_BELOW = 50;

export function eligibleSubtype(type: string, subtype: string | null): EligibleSubtype | null {
  if (type !== "depository") return null;
  return ELIGIBLE_SUBTYPES.find((candidate) => candidate === subtype) ?? null;
}

export type OwnershipEvidence = {
  nameScore: number | null;
  businessNameDetected: boolean | null;
  holderCategory: string | null;
};

export type OwnershipDecision = {
  outcome: "verified" | "needs_review" | "rejected";
  reason: string;
  nameScore: number | null;
};

// `evidence` is null when the provider could not return an Identity Match result. That is never a pass.
export function decideOwnership(evidence: OwnershipEvidence | null): OwnershipDecision {
  if (!evidence) return { outcome: "needs_review", reason: "identity_unavailable", nameScore: null };
  const { nameScore, businessNameDetected, holderCategory } = evidence;
  if (businessNameDetected || holderCategory === "business") {
    return { outcome: "rejected", reason: "unsupported_ownership", nameScore };
  }
  if (nameScore === null) return { outcome: "needs_review", reason: "no_name_score", nameScore };
  if (nameScore < REJECT_BELOW) return { outcome: "rejected", reason: "ownership_mismatch", nameScore };
  if (nameScore < VERIFY_AT_OR_ABOVE) return { outcome: "needs_review", reason: "partial_name_match", nameScore };
  return { outcome: "verified", reason: "name_match", nameScore };
}
