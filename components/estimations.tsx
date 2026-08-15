const estimationSteps = [
  {
    n: ".01",
    title: "Talk it through",
    body: "Your customer describes the problem, the project, and what they are willing to spend.",
  },
  {
    n: ".02",
    title: "Add the context",
    body: "Photos, plans, schematics, measurements, and inspiration all join the conversation.",
  },
  {
    n: ".03",
    title: "Explore the spend",
    body: "Practical, premium, and luxury options make every material and scope tradeoff clear.",
  },
  {
    n: ".04",
    title: "Get the estimation",
    body: "A preliminary bill of work, line items, assumptions, and price sensitivities—ready for review.",
  },
];

export function Estimations() {
  return (
    <section
      id="estimations"
      className="border-b border-border-soft bg-panel text-panel-text"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <span className="eyebrow text-panel-faint">
              Estimations · Built to grow
            </span>
            <h2 className="mt-5 text-4xl leading-[1.04] font-medium tracking-[-0.022em] text-balance sm:text-5xl">
              Your customer scopes the job before you touch it.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-panel-soft text-pretty">
              For any trade, Estimations turns one conversation into a clear
              scope, line items, and spending options. The customer does the
              discovery. You keep the judgment.
            </p>

            <div className="mt-12 grid grid-cols-[1fr_auto] items-end gap-8 border-t border-panel-border pt-8">
              <div>
                <p className="text-[clamp(4.5rem,11vw,8rem)] leading-none font-medium tracking-[-0.06em] text-white">
                  98%
                </p>
                <p className="eyebrow mt-3 text-panel-faint">
                  Handled by Estimations
                </p>
              </div>
              <div className="pb-1 text-right">
                <p className="text-4xl leading-none font-medium tracking-[-0.04em] text-white">
                  2%
                </p>
                <p className="eyebrow mt-3 max-w-28 text-panel-faint">
                  Human in the loop
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-panel-border">
            <ol>
              {estimationSteps.map((step) => (
                <li
                  key={step.n}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-b border-panel-border py-6"
                >
                  <span className="pt-1 font-mono text-[11px] text-panel-faint">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-panel-text">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-panel-soft">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-card border border-panel-border bg-panel-2 p-6">
              <span className="eyebrow text-panel-faint">Your 2%</span>
              <p className="mt-3 text-xl leading-snug font-medium text-white text-pretty">
                Review the opportunity. Confirm you have capacity. Approve it.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-panel-soft">
                One decision creates the job thread with the conversation,
                files, scope, and estimate already attached—so you can grow
                without adding office work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
