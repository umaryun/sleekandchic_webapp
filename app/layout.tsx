import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
