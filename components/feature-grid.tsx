import type { FeatureCard } from "@/lib/content";

type Props = {
  label: string;
  title: string;
  features: FeatureCard[];
};

export function FeatureGrid({ label, title, features }: Props) {
  return (
    <div>
      <div className="flex items-baseline gap-4 border-b border-border pb-4">
        <span className="eyebrow text-faint">{label}</span>
        <h3 className="text-xl font-medium tracking-[-0.02em]">{title}</h3>
      </div>
      <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title}>
            <dt className="text-[15px] font-medium">{feature.title}</dt>
            <dd className="mt-1.5 text-[14px] leading-relaxed text-mut">
              {feature.desc}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
