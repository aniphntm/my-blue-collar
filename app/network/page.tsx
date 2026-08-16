import type { Metadata } from "next";
import { NetworkPage } from "@/components/network-page";

export const metadata: Metadata = {
  title: "Network | MyBlueTrade",
  description: "Turn the tools you know and the problems you can solve into paid work nearby.",
};

export default function Page() {
  return <NetworkPage />;
}
