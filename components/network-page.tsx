import Link from "next/link";

const work = [
  { trade: "Landscape", task: "Finish mow + edge", tools: "Zero-turn · trimmer", level: "Operator", pay: "$240–$320", status: "4 needed" },
  { trade: "Restoration", task: "Water-loss contents", tools: "Meter · extractor", level: "Apprentice II", pay: "$310–$420", status: "3 needed" },
  { trade: "Electrical", task: "Receptacle rough-in", tools: "Meter · hand tools", level: "Journeyman", pay: "$480–$620", status: "2 needed" },
  { trade: "Hardscape", task: "Putting-green base", tools: "Plate compactor · laser", level: "Lead operator", pay: "$520–$700", status: "5 needed" },
];

const levels = [
  ["01", "Starter", "Works safely with direction; identifies tools and completes a defined task."],
  ["02", "Apprentice", "Uses a growing tool set to solve common problems under qualified supervision."],
  ["03", "Journeyman", "Diagnoses and completes a broad class of trade problems independently."],
  ["04", "Master", "Leads unfamiliar work, verifies others, and adapts practice across regions and systems."],
];

export function NetworkPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-50 border-b border-border-soft bg-nav-bg backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">MyBlueTrade</Link>
          <span className="font-mono text-[11px] text-faint">/</span>
          <span className="eyebrow text-accent">Network</span>
          <nav className="ml-auto hidden gap-6 text-[13px] text-mut md:flex">
            <a href="#work" className="hover:text-ink">Work</a>
            <a href="#equivalency" className="hover:text-ink">Qualifications</a>
            <a href="#trust" className="hover:text-ink">Trust</a>
          </nav>
          <a href="#join" className="ml-auto rounded-card bg-ink px-4 py-2 text-[13px] font-semibold text-bg md:ml-2">Find my fit →</a>
        </div>
      </header>

      <main>
        <section className="paper-grid border-b border-border-soft">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <p className="eyebrow mb-6 text-accent">The overflow labor network</p>
              <h1 className="max-w-3xl text-[clamp(3.25rem,7vw,6.8rem)] font-semibold leading-[.88] tracking-[-.065em]">
                What you can do<br /><span className="text-accent">can pay you.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-mut">
                Turn the tools you know and the problems you can solve into paid work nearby—today. No title inflation. No résumé theater. Just verified utility.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#join" className="rounded-card bg-accent px-5 py-3 text-sm font-semibold text-on-accent">Show us what you can do →</a>
                <a href="#work" className="rounded-card border border-border-mid bg-surface px-5 py-3 text-sm font-semibold">See ready work</a>
              </div>
            </div>

            <div className="overflow-hidden rounded-card border border-panel-border bg-panel text-panel-text shadow-2xl shadow-black/15">
              <div className="flex items-center justify-between border-b border-panel-border px-5 py-4">
                <span className="eyebrow text-panel-soft">Live capacity · your area</span>
                <span className="flex items-center gap-2 text-xs text-panel-soft"><i className="h-2 w-2 rounded-full bg-emerald-400" />Updated now</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-panel-border">
                <Metric value="10" label="Active jobs" />
                <Metric value="11" label="Ready next" accent />
                <Metric value="24" label="Open seats" />
              </div>
              <div className="border-t border-panel-border p-5">
                <p className="mb-4 text-xs uppercase tracking-widest text-panel-faint">Next crew to fill</p>
                <div className="rounded-md border border-panel-border bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-semibold">Putting-green installation</p><p className="mt-1 text-sm text-panel-soft">Alexandria, VA · starts Monday</p></div>
                    <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs text-amber-200">10+ people</span>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] bg-accent" /></div>
                  <div className="mt-2 flex justify-between text-xs text-panel-faint"><span>7 verified</span><span>3+ openings</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-12 grid gap-5 lg:grid-cols-2">
            <div><p className="eyebrow mb-4 text-accent">Ready work</p><h2 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">One company is full.<br />The next job is not.</h2></div>
            <p className="max-w-lg self-end text-base leading-7 text-mut lg:justify-self-end">Restoration and specialty contractors can run ten jobs at once. When job eleven is ready, the Network assembles qualified overflow labor without guessing who can actually do the work.</p>
          </div>
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead className="bg-bg-alt text-[11px] uppercase tracking-widest text-faint"><tr>{["Trade / scope", "Tools", "Verified at", "Estimated pay", "Demand"].map((h) => <th key={h} className="border-b border-border px-5 py-4 font-medium">{h}</th>)}</tr></thead>
              <tbody>{work.map((item) => <tr key={item.task} className="border-b border-border-soft last:border-0"><td className="px-5 py-5"><p className="text-xs text-mut">{item.trade}</p><p className="mt-1 font-semibold">{item.task}</p></td><td className="px-5 py-5 font-mono text-xs text-mut">{item.tools}</td><td className="px-5 py-5 text-sm">{item.level}</td><td className="px-5 py-5 text-sm font-semibold">{item.pay}</td><td className="px-5 py-5"><span className="rounded-full bg-mark px-3 py-1 text-xs text-on-mark">{item.status}</span></td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-faint">Illustrative opportunities and pay ranges. Availability, scope, and final compensation vary by job.</p>
        </section>

        <section id="equivalency" className="border-y border-border-soft bg-bg-alt">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <p className="eyebrow mb-4 text-accent">Global skill equivalency</p>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Qualified by the tools you control and the problems you solve.</h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-mut">Licenses remain local. Capability travels. We translate experience across trades, regions, and job titles into a practical record a crew lead can understand.</p>
            <div className="mt-12 grid border-l border-t border-border md:grid-cols-2 lg:grid-cols-4">
              {levels.map(([number, title, copy]) => <div key={title} className="min-h-64 border-b border-r border-border bg-surface p-6"><p className="font-mono text-xs text-accent">{number}</p><h3 className="mt-16 text-2xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-mut">{copy}</p></div>)}
            </div>
          </div>
        </section>

        <section id="trust" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.85fr_1.15fr]">
          <div><p className="eyebrow mb-4 text-accent">Built for accountable work</p><h2 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Move fast.<br />Know the line.</h2></div>
          <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
            {[
              ["Identity & qualification", "Identity, claimed capabilities, and job-specific requirements are checked before a match."],
              ["Scope before start", "The task, location, tools, supervision, compensation, and required credentials are visible before acceptance."],
              ["Independent choice", "People choose whether, when, and where to accept opportunities; accepting one job does not promise another."],
              ["Safety & accountability", "Site rules, incident reporting, insurance responsibilities, dispute handling, and conduct standards are documented."],
            ].map(([title, copy]) => <div key={title} className="bg-surface p-6"><h3 className="font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-mut">{copy}</p></div>)}
          </div>
        </section>

        <section id="join" className="bg-accent text-on-accent">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="eyebrow mb-5 opacity-75">Start with one thing</p><h2 className="max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Can you mow a lawn? That may be enough to start.</h2><p className="mt-5 max-w-2xl text-base leading-7 opacity-80">Tell us one task you can do. We’ll map the adjacent tools and problems you already understand, then show work that fits.</p></div>
            <a href="https://onboard.mybluetrade.com" className="inline-flex rounded-card bg-white px-6 py-3.5 text-sm font-semibold text-blue-700">Build my capability profile →</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-soft px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-faint sm:flex-row sm:items-center"><p>© 2026 MyBlueTrade Network</p><div className="sm:ml-auto flex gap-5"><Link href="/network/terms" className="hover:text-ink">Network Terms</Link><a href="mailto:network@mybluetrade.com" className="hover:text-ink">Contact</a></div></div>
      </footer>
    </div>
  );
}

function Metric({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return <div className="px-4 py-6 text-center"><p className={`text-4xl font-semibold tracking-tight ${accent ? "text-blue-400" : ""}`}>{value}</p><p className="mt-1 text-xs text-panel-faint">{label}</p></div>;
}
