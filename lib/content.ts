export type Trade = { name: string };

export const trades: Trade[] = [
  { name: "Electrical" },
  { name: "HVAC" },
  { name: "Roofing" },
  { name: "Flooring" },
  { name: "Landscaping" },
  { name: "Plumbing" },
  { name: "Painting" },
  { name: "Remodeling" },
  { name: "Masonry" },
];

/* ── Hero flow panel ─────────────────────────────────────────────────── */

export type FlowStep = { n: string; title: string; note: string };

export const heroFlow: FlowStep[] = [
  { n: ".01", title: "Work comes in", note: "referrals, callbacks, the phone" },
  { n: ".02", title: "Booked and dispatched", note: "one thread, one crew, one day" },
  { n: ".03", title: "Invoiced and paid", note: "sent on the truck, cleared by Friday" },
  { n: ".04", title: "They call you again", note: "the part everyone forgets" },
];

/* ── 01 — The platform: rule cards ───────────────────────────────────── */

export type RuleCard = {
  eyebrow: string;
  title: string;
  body: string;
  rule: string;
};

export const ruleCards: RuleCard[] = [
  {
    eyebrow: "FREE · NOT A TRIAL",
    title: "Free stays free",
    body: "Scheduling, customers, estimates, invoicing. No trial clock, no card on file, no feature you lose on day thirty.",
    rule: "RULE → the essentials never go behind a paywall",
  },
  {
    eyebrow: "ONE THREAD · PER JOB",
    title: "Nothing falls through",
    body: "Every call, text, photo, estimate, and invoice stays with the job, in order. The thread is the record.",
    rule: "RULE → one job, one thread, start to paid",
  },
  {
    eyebrow: "YOURS · NOT OURS",
    title: "Your customers are yours",
    body: "Your list, your history, your relationships. Export it any day you like. We don't rent your customers back to you.",
    rule: "RULE → your book of business leaves when you do",
  },
];

/* ── 02 — One job, one thread ───────────────────────────────────────── */

export type JobThread = {
  job: string;
  trade: string;
  status: string;
  crew: string;
  activity: string;
  tools: string[];
  accent: string;
  dot: string;
};

export const jobThreads: JobThread[] = [
  {
    job: "Carter kitchen",
    trade: "Electrical",
    status: "On site",
    crew: "Mike + 2",
    activity: "3 photos · permit attached",
    tools: ["Gmail", "SMS", "QuickBooks"],
    accent: "border-l-blue-500",
    dot: "bg-blue-500",
  },
  {
    job: "Park rooftop unit",
    trade: "HVAC",
    status: "Estimate sent",
    crew: "Rosa",
    activity: "Customer viewed 18m ago",
    tools: ["Gmail", "QuickBooks"],
    accent: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  {
    job: "Northside service call",
    trade: "Plumbing",
    status: "Scheduled",
    crew: "Truck 3",
    activity: "Tomorrow · 8:30 AM",
    tools: ["Calendar", "SMS"],
    accent: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  {
    job: "Mendez roof repair",
    trade: "Roofing",
    status: "Waiting on parts",
    crew: "Dale + 3",
    activity: "Supplier replied today",
    tools: ["Gmail", "Files"],
    accent: "border-l-violet-500",
    dot: "bg-violet-500",
  },
  {
    job: "Wilson panel upgrade",
    trade: "Electrical",
    status: "Ready to invoice",
    crew: "Mike",
    activity: "Time + materials approved",
    tools: ["SMS", "QuickBooks"],
    accent: "border-l-rose-500",
    dot: "bg-rose-500",
  },
];

/* ── 03 — The flow, as a journey ─────────────────────────────────────── */

export type JourneyStep = {
  n: string;
  kicker: string;
  title: string;
  body: string;
};

export const journey: JourneyStep[] = [
  {
    n: ".01",
    kicker: "WORK IN",
    title: "Fill the calendar",
    body: "Referrals from past customers and fellow trades, follow-ups that send themselves, win-backs on the jobs that went quiet. The phone rings because the system kept asking.",
  },
  {
    n: ".02",
    kicker: "WORK DONE",
    title: "Run the day",
    body: "Schedule the crew, dispatch the truck, keep the photos and permits on the job. Everyone knows where they're going before the coffee's cold.",
  },
  {
    n: ".03",
    kicker: "GET PAID",
    title: "Close it out",
    body: "Estimate on the driveway, invoice before you pull away, reminders that chase the late ones for you. Collections stop being a Sunday job.",
  },
  {
    n: ".04",
    kicker: "NETWORK · SOON",
    title: "Pass on what isn't yours",
    body: "A verified local trade for the work outside your specialty. Refer it instead of losing it — overflow jobs, shared crews, revenue that comes back around.",
  },
];

/* ── Capability lists ────────────────────────────────────────────────── */

export type FeatureCard = { title: string; desc: string };

export const growFeatures: FeatureCard[] = [
  { title: "Warm inbound", desc: "Referrals from your customers and the trades beside you." },
  { title: "Automated outreach", desc: "Follow-ups, reactivations, and win-backs on autopilot." },
  { title: "Customer CRM", desc: "Built in, or synced with Google, QuickBooks, Jobber, Housecall Pro." },
  { title: "Reviews & referrals", desc: "Email, SMS, and the nudge that gets you written up." },
];

export const maintainFeatures: FeatureCard[] = [
  { title: "Scheduling", desc: "Calendar, dispatch, and crew assignments in one view." },
  { title: "Labor", desc: "Who's working, who's free, time tracked against the job." },
  { title: "Customer history", desc: "Past jobs, photos, notes, and invoices — per customer." },
  { title: "Invoicing", desc: "Estimates, invoices, and reminders that send themselves." },
  { title: "Collections", desc: "Late notices, automatic follow-up, and a record of the dispute." },
  { title: "Files", desc: "Photos, contracts, documents, and permits — attached to the job." },
];

/* ── 03 — Who's on the tools ─────────────────────────────────────────── */

export type Persona = { eyebrow: string; headline: string; body: string };

export const personas: Persona[] = [
  {
    eyebrow: "OWNER-OPERATOR · THE TRUCK",
    headline: "You are the crew, the office, and the answering service.",
    body: "The paperwork happens at ten at night because the day was spent on the tools. It shouldn't have to.",
  },
  {
    eyebrow: "SMALL CREW · THE BOARD",
    headline: "Three trucks, one whiteboard, and a lot of texting.",
    body: "Everyone needs to know where they're going and what happened yesterday. Put it somewhere they can all see.",
  },
  {
    eyebrow: "GROWING SHOP · THE BOOK",
    headline: "Enough work to lose track of the work.",
    body: "At a certain size the jobs you forget cost more than the jobs you win. The thread is the fix.",
  },
];

/* ── 04 — Pricing ────────────────────────────────────────────────────── */

export type PricingTier = {
  name: string;
  badge: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    badge: "Available now",
    desc: "Everything it takes to run the business.",
    features: [
      "Scheduling & dispatch",
      "Customer CRM & history",
      "Estimates & invoicing",
      "Growth & referral tools",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Pro",
    badge: "Coming soon",
    desc: "Advanced power for a growing crew.",
    features: ["Automation", "Advanced reporting", "AI tools", "Advanced integrations"],
    cta: "Get notified",
    highlighted: false,
  },
  {
    name: "Network",
    badge: "Coming soon",
    desc: "Earn from the trades around you.",
    features: [
      "Subcontractor marketplace",
      "Verified local trades",
      "Overflow jobs & revenue",
      "Priority matching",
    ],
    cta: "Get notified",
    highlighted: false,
  },
];

/* ── FAQ ─────────────────────────────────────────────────────────────── */

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Is it really free?",
    a: "Yes. Scheduling, customers, invoicing, and growth tools — free. No trial, no card on file. Paid tiers add advanced features later; the essentials stay where they are.",
  },
  {
    q: "Can I keep my CRM?",
    a: "Yes. Sync with Google Contacts, Google Sheets, QuickBooks, Jobber, or Housecall Pro — or use ours if you're starting fresh.",
  },
  {
    q: "Which trades is this for?",
    a: "Every local service business: electrical, HVAC, plumbing, roofing, flooring, landscaping, painting, remodeling, restoration, and dozens more.",
  },
  {
    q: "Do I have to switch everything at once?",
    a: "No. Take the parts you need — scheduling, invoicing, or growth — and keep whatever already works for you.",
  },
  {
    q: "When do the paid plans land?",
    a: "Pro and Network open after the beta. Beta members get first access and preferred pricing.",
  },
];
