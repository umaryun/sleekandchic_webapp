import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { siteUrl } from "@/lib/env";

// Self-hosted by Next.js: no request to Google from shoppers' browsers.
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  // Makes share-preview and canonical links absolute.
  metadataBase: new URL(siteUrl),
  title: "Sleekandchic | Abayas, Bubu, Kaftans & Modest Fashion",
  description:
    "Abayas, bubu, kaftans, gowns and modest fashion from Kaduna, delivered across Nigeria. Pay by card, transfer or on delivery.",
  openGraph: {
    title: "Sleekandchic | Modest Fashion",
    description: "Abayas, bubu, kaftans and gowns from Kaduna, delivered across Nigeria.",
    type: "website",
    siteName: "Sleekandchic",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
