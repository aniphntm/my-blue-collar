import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyBlueTrade — Software for the trades",
  description: "Run the work, get paid, and do it again — without a monthly fee.",
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
