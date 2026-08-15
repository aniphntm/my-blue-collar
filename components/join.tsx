import { WaitlistForm } from "./waitlist-form";

const checklist = [
  "The essentials, free forever",
  "Set up between jobs, not over a weekend",
  "Beta members shape what ships next",
];

export function Join() {
  return (
    <section id="join" className="paper-grid border-b border-border-soft">
      <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[1fr_440px] lg:gap-20">
        <div>
          <span className="eyebrow text-faint">Beta — waitlist open</span>
          <h2 className="mt-5 text-4xl leading-[1.04] font-medium tracking-[-0.022em] text-balance sm:text-5xl">
            Get your account.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-3 text-pretty">
            Tell us who you are and what you run. We&apos;ll write when a beta
            spot opens near you.
          </p>

          <ul className="mt-10 space-y-3 text-[15px] text-mut">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-faint">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <WaitlistForm />
      </div>
    </section>
  );
}
