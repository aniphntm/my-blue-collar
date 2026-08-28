import { createHash } from "node:crypto";
import {
  APPLICATION_QUESTION_SET_VERSION,
  APPLICATION_TRACKS,
  type ApplicationTrack,
} from "./application-questions";

export type ApplicationAnswer = {
  id: string;
  question: string;
  answer: string;
};

export type ApplicationInput = {
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  track: ApplicationTrack;
  questionSetVersion: typeof APPLICATION_QUESTION_SET_VERSION;
  questionAnswers: ApplicationAnswer[];
  workBackground: string;
  linkedInUrl: string | null;
  portfolioUrl: string | null;
  consentToContact: true;
  startedAt: string;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalUrl(value: unknown) {
  const text = clean(value, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseApplication(body: Record<string, unknown>): ApplicationInput | null {
  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 40) || null;
  const location = clean(body.location, 160) || null;
  const track = clean(body.track, 32);
  const questionSetVersion = clean(body.questionSetVersion, 40);
  const linkedInUrl = optionalUrl(body.linkedInUrl);
  const portfolioUrl = optionalUrl(body.portfolioUrl);
  const startedAt = clean(body.startedAt, 40);
  const started = Date.parse(startedAt);
  const elapsed = Date.now() - started;

  if (!(track in APPLICATION_TRACKS)) return null;
  const selectedTrack = APPLICATION_TRACKS[track as ApplicationTrack];
  const rawAnswers = body.answers;
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) return null;

  const questionAnswers: ApplicationAnswer[] = [];
  for (const question of selectedTrack.questions) {
    const rawAnswer = (rawAnswers as Record<string, unknown>)[question.id];
    if (typeof rawAnswer !== "string") return null;
    const answer = rawAnswer.trim();
    if (answer.length < 2 || answer.length > 240) return null;
    questionAnswers.push({ id: question.id, question: question.prompt, answer });
  }

  const answerKeys = Object.keys(rawAnswers);
  if (answerKeys.length !== selectedTrack.questions.length) return null;
  const workBackground = JSON.stringify({
    questionSetVersion: APPLICATION_QUESTION_SET_VERSION,
    track,
    answers: questionAnswers,
  });

  if (
    fullName.length < 2 ||
    !/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email) ||
    questionSetVersion !== APPLICATION_QUESTION_SET_VERSION ||
    workBackground.length < 20 ||
    workBackground.length > 4000 ||
    body.consentToContact !== true ||
    !Number.isFinite(started) ||
    elapsed < 2_000 ||
    elapsed > 86_400_000
  ) return null;

  return {
    fullName, email, phone, location,
    track: track as ApplicationTrack,
    questionSetVersion: APPLICATION_QUESTION_SET_VERSION,
    questionAnswers,
    workBackground, linkedInUrl, portfolioUrl,
    consentToContact: true, startedAt,
  };
}

export function requestFingerprint(request: Request) {
  const secret = process.env.APPLICATION_FINGERPRINT_SECRET;
  if (!secret) return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${secret}:${forwarded}:${agent}`).digest("hex");
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  const columns = [
    "created_at", "status", "role_interest", "full_name", "email", "phone",
    "location", "linkedin_url", "portfolio_url", "work_background", "consented_at",
  ];
  const cell = (value: unknown) => {
    const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
    const safe = text.replace(/^[=+\-@]/, "'$&").replaceAll('"', '""');
    return `"${safe}"`;
  };
  return [columns.map(cell).join(","), ...rows.map((row) => columns.map((key) => cell(row[key])).join(","))].join("\r\n");
}
