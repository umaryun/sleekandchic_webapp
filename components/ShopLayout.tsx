"use client";

import { type ReactNode } from "react";
import Header from "./Header";
import Navigation from "./Navigation";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

interface ShopLayoutProps {
  children: ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <>
      <Header compareCount={0} />
      <Navigation />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
