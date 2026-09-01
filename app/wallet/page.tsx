import { CustomerWallet } from "@/components/customer-wallet";
import { WalletConnectBeta } from "@/components/wallet-connect-beta";

export default function WalletPage() {
  return (
    <>
      <WalletConnectBeta />
      <CustomerWallet />
    </>
  );
}
