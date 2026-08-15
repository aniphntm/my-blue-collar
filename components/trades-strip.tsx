import { trades } from "@/lib/content";

export function TradesStrip() {
  return (
    <section className="border-b border-border-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:gap-10">
        <span className="eyebrow shrink-0 text-faint">Built for</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-mut">
          {trades.map((trade) => (
            <span key={trade.name}>{trade.name}</span>
          ))}
          <span className="text-faint">+ dozens more</span>
        </div>
      </div>
    </section>
  );
}
