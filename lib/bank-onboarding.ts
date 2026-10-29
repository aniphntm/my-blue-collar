// Client-safe contract for bank onboarding. Never put provider ids or tokens in these types.
export type BankOnboardingStatus = "none" | "created" | "exchanging" | "verified" | "needs_review" | "rejected" | "failed";

export type MaskedBank = {
  institutionName: string | null;
  accountName: string;
  mask: string | null;
};

export type BankOnboardingView = {
  status: BankOnboardingStatus;
  reason?: string;
  bank?: MaskedBank;
};

export const LEGAL_NAME_MIN = 2;
export const LEGAL_NAME_MAX = 120;
