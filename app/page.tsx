"use client";

import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HeroSlider from "@/components/HeroSlider";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function HomePage() {
  return (
    <>
      {/* Sticky header with logo, search, icons */}
      <Header />

      {/* Navigation with category dropdown + links */}
      <Navigation />

      {/* Main content */}
      <main>
        {/* Hero slider */}
        <HeroSlider />

        {/* Shop by category */}
        <CategorySection />

        {/* Featured products grid */}
        <FeaturedProducts />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </>
  );
}
