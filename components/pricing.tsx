import { pricingTiers } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border-soft bg-bg-alt">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          index="04 — Pricing"
          lede="The essentials are free and stay free. Paid tiers open after the beta, and beta members get preferred pricing."
        >
          Start free.
          <br />
          Stay free.
        </SectionHead>

        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className="flex flex-col bg-bg p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-2xl font-medium tracking-[-0.02em]">
                  {tier.name}
                </h3>
                <span
                  className={`eyebrow ${
                    tier.highlighted ? "text-accent" : "text-faint"
                  }`}
                >
                  {tier.badge}
                </span>
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
                {tier.desc}
              </p>

              <ul className="mt-7 space-y-2.5 text-[14px] text-mut">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="text-faint">→</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#join"
                className={`mt-auto pt-10 text-[13px] transition-colors ${
                  tier.highlighted
                    ? "text-accent hover:text-accent-dark"
                    : "text-mut hover:text-ink"
                }`}
              >
                {tier.cta} <span className="opacity-60">→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
