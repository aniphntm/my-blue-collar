import { ruleCards } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Problems() {
  return (
    <section id="platform" className="border-b border-border-soft">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead
          index="01 — The platform"
          lede="Scheduling, customers, estimates, invoicing, and the follow-up that fills next week. One system, no monthly fee."
        >
          Your work,
          <br />
          all in one thread.
        </SectionHead>

        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-3">
          {ruleCards.map((card) => (
            <div key={card.title} className="flex flex-col bg-bg p-8">
              <span className="eyebrow text-faint">{card.eyebrow}</span>
              <h3 className="mt-5 text-2xl font-medium tracking-[-0.02em]">
                {card.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
                {card.body}
              </p>
              <p className="rule-line mt-auto pt-8 text-faint">{card.rule}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
