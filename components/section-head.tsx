type Props = {
  /** e.g. "01 — The platform" */
  index: string;
  /** Headline, usually two short lines. */
  children: React.ReactNode;
  lede?: string;
};

export function SectionHead({ index, children, lede }: Props) {
  return (
    <div className="max-w-2xl">
      <span className="eyebrow text-faint">{index}</span>
      <h2 className="mt-5 text-4xl leading-[1.04] font-medium tracking-[-0.022em] text-balance sm:text-5xl">
        {children}
      </h2>
      {lede ? (
        <p className="mt-5 text-lg leading-relaxed text-ink-3 text-pretty">
          {lede}
        </p>
      ) : null}
    </div>
  );
}
