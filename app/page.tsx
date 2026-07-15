"use client";

import { useState, useCallback } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HeroSlider from "@/components/HeroSlider";
import FeaturedBanners from "@/components/FeaturedBanners";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import PromoSection from "@/components/PromoSection";
import FeatureBar from "@/components/FeatureBar";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import type { Product } from "@/types";

export default function HomePage() {
  const [cartCount, setCartCount] = useState(2);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [compareCount] = useState(0);

  const handleAddToCart = useCallback((product: Product) => {
    setCartCount((prev) => prev + 1);
    console.log("Added to cart:", product.name);
  }, []);

  const handleAddToWishlist = useCallback((product: Product) => {
    setWishlistCount((prev) => prev + 1);
    console.log("Added to wishlist:", product.name);
  }, []);

  return (
    <>
      {/* Top announcement bar */}
      {/* <AnnouncementBar /> */}

      {/* Sticky header with logo, search, icons */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        compareCount={compareCount}
      />

      {/* Navigation with category dropdown + links */}
      <Navigation />

      {/* Main content */}
      <main>
        {/* Hero slider */}
        <HeroSlider />

        {/* Two promotional banners */}
        {/* <FeaturedBanners /> */}

        {/* Features bar */}
        {/* <FeatureBar /> */}

        {/* Shop by category */}
        <CategorySection />

        {/* Featured products grid */}
        <FeaturedProducts
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />

        {/* Promo countdown banner */}
        <PromoSection />

        {/* Newsletter signup */}
        {/* <NewsletterSection /> */}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </>
  );
}
