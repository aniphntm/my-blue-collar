const links = [
  { href: "#platform", label: "Platform" },
  { href: "#flow", label: "Flow" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border-soft bg-nav-bg backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <a href="#top" className="flex items-baseline gap-2 tracking-tight">
          <span className="text-[15px] font-semibold">MyBlueCollar</span>
          <span className="font-mono text-[11px] text-faint">|</span>
          <span className="eyebrow text-mut">Trades</span>
        </a>

        <div className="ml-auto hidden items-center gap-6 text-[13px] text-mut sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#join"
          className="ml-auto rounded-card border border-border-mid px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:border-ink sm:ml-0"
        >
          Join <span className="text-faint">→</span>
        </a>
      </div>
    </nav>
  );
}
