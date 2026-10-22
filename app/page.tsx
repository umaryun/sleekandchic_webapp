import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HeroSlider from "@/components/HeroSlider";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import TrustStrip from "@/components/TrustStrip";
import WhatsAppButton from "@/components/WhatsAppButton";

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

        {/* Delivery, payment, returns, WhatsApp */}
        <TrustStrip />

        {/* Shop by category */}
        {/* <CategorySection /> */}

        {/* Featured products grid */}
        <FeaturedProducts />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
      <WhatsAppButton />
    </>
  );
}
