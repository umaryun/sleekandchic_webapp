"use client";

import { useState, useCallback, type ReactNode } from "react";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Navigation from "./Navigation";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import type { Product } from "@/types";

interface ShopLayoutProps {
  children: ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const [cartCount, setCartCount] = useState(2);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [compareCount] = useState(0);

  const handleAddToCart = useCallback((_product: Product) => {
    setCartCount((prev) => prev + 1);
  }, []);

  const handleAddToWishlist = useCallback((_product: Product) => {
    setWishlistCount((prev) => prev + 1);
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Header cartCount={cartCount} wishlistCount={wishlistCount} compareCount={compareCount} />
      <Navigation />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
