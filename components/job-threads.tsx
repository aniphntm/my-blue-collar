import { jobThreads } from "@/lib/content";
import { SectionHead } from "./section-head";

export function JobThreads() {
  return (
    <section className="border-b border-border-soft bg-bg-alt">
      <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <SectionHead
            index="02 — One job, one thread"
            lede="If you have 5 active jobs, you have 5 active threads. Each one keeps the people, messages, paperwork, and money for that job together."
          >
            Every job has
            <br />
            one home.
          </SectionHead>

          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-ink-3 text-pretty">
            Keep using Gmail, QuickBooks, your calendar, and text messages.
            BlueCollar ties them back to the right job, so the office sees the
            whole picture while your crew gets updates wherever they already
            work.
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between gap-6 border-b border-border pb-4">
            <div>
              <p className="eyebrow text-faint">Active jobs</p>
              <p className="mt-1 text-sm text-mut">Your shop · right now</p>
            </div>
            <p className="font-mono text-3xl tabular-nums text-ink">05</p>
          </div>

          <ol className="divide-y divide-border border-b border-border">
            {jobThreads.map((thread, index) => (
              <li
                key={thread.job}
                className={`border-l-2 ${thread.accent} bg-bg px-5 py-5 sm:px-6`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${thread.dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-faint tabular-nums">
                          JOB {String(index + 1).padStart(2, "0")} · {thread.trade}
                        </p>
                        <h3 className="mt-1 text-lg font-medium tracking-[-0.02em] text-balance">
                          {thread.job}
                        </h3>
                      </div>
                      <span className="shrink-0 text-[13px] font-medium text-ink-2">
                        {thread.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-[13px] text-mut sm:grid-cols-2">
                      <p>
                        <span className="text-faint">Crew</span> · {thread.crew}
                      </p>
                      <p className="sm:text-right">{thread.activity}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {thread.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full border border-border-mid px-2.5 py-1 font-mono text-[10px] text-faint"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="rule-line mt-5 text-faint">
            One view for the shop · every update reaches the right people
          </p>
        </div>
      </div>
    </section>
  );
}
