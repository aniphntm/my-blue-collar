import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bluework — Issuer Console",
  description: "Testnet controls for crypto-backed charge cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
