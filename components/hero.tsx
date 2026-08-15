import { heroFlow } from "@/lib/content";

type HeroProps = {
  headline: string;
};

export function Hero({ headline }: HeroProps) {
  return (
    <header id="top" className="paper-grid border-b border-border-soft">
      <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-20">
        <div>
          <div className="inline-flex items-center gap-2 text-mut">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="eyebrow">Free beta — waitlist open</span>
          </div>

          <h1 className="mt-8 text-6xl leading-[0.98] font-medium tracking-[-0.022em] text-balance sm:text-7xl">
            {headline}
          </h1>

          <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink-3 text-pretty">
            One place to run the trade — find the work, do the work, get paid
            for it. Built for electricians, plumbers, HVAC, roofers, and
            everyone in between.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              href="#join"
              className="rounded-card bg-accent px-5 py-2.5 text-[15px] font-medium text-on-accent transition-colors hover:bg-accent-dark"
            >
              Join →
            </a>
            <span className="eyebrow text-faint">+ free forever</span>
          </div>
        </div>

        {/* Illustrative flow panel — the dark inset Kagaz uses beside the head. */}
        <div className="rounded-card border border-panel-border bg-panel p-6 shadow-[0_18px_50px_-24px_#14130e40]">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow text-panel-soft">Job / Flow</span>
            <span className="eyebrow text-panel-faint">Illustrative</span>
          </div>

          <ol className="mt-6 space-y-5">
            {heroFlow.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="mt-0.5 font-mono text-[11px] text-panel-faint">
                  {step.n}
                </span>
                <span>
                  <span className="block text-sm text-panel-text">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-panel-faint">
                    {step.note}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}
