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
  if (hostname === "myblueclues.com" || hostname.endsWith(".myblueclues.com")) return <CustomerWallet />;
  const headline =
    hostname === "mybluetrade.com" ||
    hostname.endsWith(".mybluetrade.com") ||
    hostname === "mybluework.com" ||
    hostname.endsWith(".mybluework.com")
      ? "Get jobs.\nGet paid.\nRepeat."
      : hostname === "mybluetrades.com" ||
          hostname.endsWith(".mybluetrades.com")
        ? "Jobs.\nPaid.\nRepeat."
        : "Get jobs.";

  return <LandingPage headline={headline} />;
}

function LandingPage({ headline }: { headline: string }) {
  return (
    <>
      <Nav />
      <main>
        <Hero headline={headline} />
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
