const links = [
  { href: "#platform", label: "Platform" },
  { href: "#flow", label: "Flow" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-[15px] font-semibold tracking-tight">
              MyBlueCollar
            </span>
            <p className="mt-1.5 text-[13px] text-mut">
              Software for the trades
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-mut">
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
        </div>

        <p className="mt-12 border-t border-border pt-6 text-[13px] text-faint">
          © 2026 MyBlueCollar — leads in, jobs out, paid on time.
        </p>
      </div>
    </footer>
  );
}
