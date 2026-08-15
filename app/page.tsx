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

export default async function Home() {
  const host = (await headers()).get("host") ?? "";
  if (host.endsWith("mybluefinancial.com")) return <IssuerConsole />;

  const hostname = host.split(":")[0];
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

  return <LandingPage headline={headline} heroLede={heroLede} />;
}

function LandingPage({
  headline,
  heroLede,
}: {
  headline: string;
  heroLede?: string;
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
        <Pricing />
        <Join />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
