import { Faq } from "@/components/faq";
import { CustomerWallet } from "@/components/customer-wallet";
import { Estimations } from "@/components/estimations";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { FutureVision } from "@/components/future-vision";
import { Hero } from "@/components/hero";
import { IssuerConsole } from "@/components/issuer-console";
import { JobThreads } from "@/components/job-threads";
import { Join } from "@/components/join";
import { Nav } from "@/components/nav";
import { PlatformWorkflow } from "@/components/platform-workflow";
import { Pricing } from "@/components/pricing";
import { Problems } from "@/components/problems";
import { TradesStrip } from "@/components/trades-strip";
import { WhyFree } from "@/components/why-free";
import { headers } from "next/headers";
import { AnjaliVideo } from "@/components/anjali-video";

export default async function Home() {
  const host = (await headers()).get("host") ?? "";
  if (host.endsWith("mybluefinancial.com")) return <IssuerConsole />;

  const hostname = host.split(":")[0];
  if (hostname === "anjali.mybluetrade.com") return <AnjaliVideo />;
  if (
    hostname === "myblueclues.com" ||
    hostname.endsWith(".myblueclues.com") ||
    hostname === "wallet.mybluecollar.dev"
  ) return <CustomerWallet />;
  const isMyBlueWork =
    hostname === "mybluework.com" || hostname.endsWith(".mybluework.com");
  const headline =
    hostname === "mybluetrade.com" ||
    hostname.endsWith(".mybluetrade.com")
      ? "Get jobs.\nGet paid.\nRepeat."
      : hostname === "mybluetrades.com" ||
          hostname.endsWith(".mybluetrades.com")
        ? "Jobs.\nPaid.\nRepeat."
        : isMyBlueWork
          ? "Every job has\none thread."
          : "Get jobs.";
  const heroLede = isMyBlueWork
    ? "Every message, photo, estimate, invoice, and payment stays with the job—from first call to paid."
    : undefined;

  const showMyBlueCoin =
    hostname === "myblueinc.com" || hostname === "www.myblueinc.com";

  return (
    <LandingPage
      headline={headline}
      heroLede={heroLede}
      showMyBlueCoin={showMyBlueCoin}
    />
  );
}

function LandingPage({
  headline,
  heroLede,
  showMyBlueCoin,
}: {
  headline: string;
  heroLede?: string;
  showMyBlueCoin: boolean;
}) {
  return (
    <>
      <Nav />
      <main>
        <Hero headline={headline} lede={heroLede} />
        <TradesStrip />
        <Problems />
        <Estimations />
        <JobThreads />
        <PlatformWorkflow />
        <FeaturesSection />
        <FutureVision />
        <WhyFree />
        {showMyBlueCoin && (
          <section
            id="mybluecoin"
            aria-labelledby="mybluecoin-heading"
            className="border-b border-border-soft"
          >
            <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
              <span className="eyebrow text-faint">Coming soon</span>
              <h2
                id="mybluecoin-heading"
                className="mt-5 text-3xl font-medium tracking-[-0.02em] sm:text-4xl"
              >
                MyBlueCoin <span className="text-accent">$BLUE</span>
              </h2>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-3">
                MyBlueCoin ($BLUE) is our upcoming token, with a vision to
                support the DeFi rails behind MyBlueFinancial and MyBlueTrades as
                we build toward cards, payments, and savings.
              </p>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-3">
                Our ambition: grow with our community, stay independent of VC
                funding, and keep building for working people. No Hollywood.
              </p>
            </div>
          </section>
        )}
        <Pricing />
        <Join />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
