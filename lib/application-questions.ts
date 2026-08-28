export const APPLICATION_QUESTION_SET_VERSION = "2026-08-23-v1";

export type ApplicationTrack = "go_to_market" | "operations" | "engineering";

type ApplicationQuestion = {
  id: string;
  prompt: string;
};

type TenQuestions = readonly [
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
  ApplicationQuestion,
];

export const APPLICATION_TRACKS = {
  go_to_market: {
    label: "Go to Market",
    summary: "Own measurable outcomes. Build trust and create lasting customer value.",
    questions: [
      { id: "customer_problem", prompt: "What customer problem would you own first?" },
      { id: "earn_trust", prompt: "How do you earn trust quickly?" },
      { id: "delivered_outcome", prompt: "Describe an outcome you personally delivered." },
      { id: "qualified_opportunities", prompt: "How do you find qualified opportunities?" },
      { id: "useful_conversation", prompt: "What makes a sales conversation useful?" },
      { id: "clear_no", prompt: "How do you handle a clear no?" },
      { id: "measure_value", prompt: "How do you measure value you created?" },
      { id: "walk_away", prompt: "When should you walk away from revenue?" },
      { id: "after_closing", prompt: "How do you stay accountable after closing?" },
      { id: "trades_now", prompt: "Why build for the trades now?" },
    ] satisfies TenQuestions,
  },
  operations: {
    label: "Operations",
    summary: "Find recurring problems and continuously improve how the company runs.",
    questions: [
      { id: "recurring_problem", prompt: "What recurring problem would you investigate first?" },
      { id: "hidden_friction", prompt: "How do you spot hidden operational friction?" },
      { id: "improved_process", prompt: "Describe a process you improved end to end." },
      { id: "memory", prompt: "What should never depend on memory?" },
      { id: "prioritize", prompt: "How do you prioritize competing operational issues?" },
      { id: "stay_manual", prompt: "When should a process stay manual?" },
      { id: "measure_improvement", prompt: "How do you measure an improvement?" },
      { id: "prevent_return", prompt: "How do you prevent problems from returning?" },
      { id: "frontline_feedback", prompt: "What feedback do frontline teams need?" },
      { id: "small_improvements", prompt: "Why do small improvements compound?" },
    ] satisfies TenQuestions,
  },
  engineering: {
    label: "Engineering",
    summary: "Build useful technology, scope clearly, and ship reliable systems.",
    questions: [
      { id: "ship_first", prompt: "What technology would you ship first?" },
      { id: "built_shipped", prompt: "Describe something useful you built and shipped." },
      { id: "fast_release", prompt: "How do you scope a fast release?" },
      { id: "simple_architecture", prompt: "When is simple architecture the right choice?" },
      { id: "test_behavior", prompt: "How do you test critical behavior?" },
      { id: "production_failures", prompt: "How do you handle production failures?" },
      { id: "easy_change", prompt: "What makes code easy to change?" },
      { id: "customer_feedback", prompt: "How do you use customer feedback?" },
      { id: "remove_feature", prompt: "When should you remove a feature?" },
      { id: "technology_trades", prompt: "Why build technology for the trades?" },
    ] satisfies TenQuestions,
  },
} as const satisfies Record<
  ApplicationTrack,
  { label: string; summary: string; questions: TenQuestions }
>;

export const APPLICATION_TRACK_ENTRIES = Object.entries(APPLICATION_TRACKS) as Array<
  [ApplicationTrack, (typeof APPLICATION_TRACKS)[ApplicationTrack]]
>;
