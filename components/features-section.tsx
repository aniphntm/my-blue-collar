import { growFeatures, maintainFeatures } from "@/lib/content";
import { FeatureGrid } from "./feature-grid";

export function FeaturesSection() {
  return (
    <section className="border-b border-border-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-24">
        <FeatureGrid
          label="Grow · get more work"
          title="What brings the work in"
          features={growFeatures}
        />
        <FeatureGrid
          label="Manage · get it done"
          title="What gets the work done"
          features={maintainFeatures}
        />
      </div>
    </section>
  );
}
