import { personas } from "@/lib/content";
import { SectionHead } from "./section-head";

export function FutureVision() {
  return (
    <section className="border-b border-border-soft">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHead index="04 — Who's on the tools">
          Built for people
          <br />
          like you.
        </SectionHead>

        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-3">
          {personas.map((persona) => (
            <div key={persona.eyebrow} className="flex flex-col bg-bg p-8">
              <span className="eyebrow text-faint">{persona.eyebrow}</span>
              <h3 className="mt-5 text-xl leading-snug font-medium tracking-[-0.02em] text-balance">
                {persona.headline}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
                {persona.body}
              </p>
              <a
                href="#join"
                className="mt-auto pt-8 text-[13px] text-mut transition-colors hover:text-ink"
              >
                Your page <span className="text-faint">→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
