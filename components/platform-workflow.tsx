import { journey } from "@/lib/content";
import { SectionHead } from "./section-head";

export function PlatformWorkflow() {
  return (
    <section id="flow" className="border-b border-border-soft bg-bg-alt">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead index="02 — The flow, as a journey">
          A day you can see,
          <br />
          not decipher.
        </SectionHead>

        <div className="mt-16 space-y-px border-t border-border">
          {journey.map((step) => (
            <div
              key={step.n}
              className="grid gap-4 border-b border-border py-8 md:grid-cols-[7rem_1fr_1.4fr] md:gap-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-faint">
                  {step.n}
                </span>
                <span className="font-mono text-[11px] text-faint">/</span>
                <span className="eyebrow text-mut">{step.kicker}</span>
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.02em] text-balance">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
