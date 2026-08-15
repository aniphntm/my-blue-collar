import { CustomerWallet } from "@/components/customer-wallet";
import { Faq } from "@/components/faq";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { FutureVision } from "@/components/future-vision";
import { Hero } from "@/components/hero";
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
  if (host.startsWith("wallet.mybluefinancial.com")) return <CustomerWallet />;

  return <LandingPage />;
}

function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TradesStrip />
        <Problems />
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
