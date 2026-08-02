import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Sleekandchic — Premium Handcrafted Goods & Accessories",
  description:
    "Discover premium handcrafted products, accessories, home décor, and more. Shop the latest collections with up to 40% off.",
  keywords: "ecommerce, handcrafted, accessories, furniture, cosmetics, gifts",
  openGraph: {
    title: "Sleekandchic — Premium Handcrafted Goods & Accessories",
    description: "Shop the finest handcrafted products from around the world.",
    type: "website",
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
