"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import CartDrawer from "./CartDrawer";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/context/CartContext";

function SearchForm({ id, className, onDone }: { id: string; className?: string; onDone?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    onDone?.();
  };

  return (
    <form role="search" onSubmit={submit} className={className}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        placeholder="Search abayas, kaftans, gowns…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 min-w-0 px-3.5 text-sm text-[#1a1a1a] bg-transparent outline-none"
      />
      <button type="submit" aria-label="Search" className="px-4 flex items-center text-[#1a1a1a] cursor-pointer">
        <Search size={18} />
      </button>
    </form>
  );
}

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 bg-[#8a6452] text-white rounded-full min-w-4 h-4 px-1 text-[10px] flex items-center justify-center font-bold">
      {count}
    </span>
  );
}

export default function Header() {
  const { cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartLabel = cartCount === 0 ? "Open bag" : `Open bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white my-2.5">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-5 h-[72px]">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-[#1a1a1a] p-1 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <Link href="/" className="shrink-0 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sleekandchic" className="w-[160px] md:w-[190px]" />
          </Link>

          <SearchForm id="header-search" className="hidden md:flex flex-1 max-w-[680px] h-11 rounded-[5px] bg-[#F3F4F7]" />

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-4 ml-auto">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#1a1a1a] p-1 cursor-pointer"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search size={22} />
            </button>
            <button type="button" onClick={() => setCartOpen(true)} className="text-[#1a1a1a] p-1 relative cursor-pointer" aria-label={cartLabel}>
              <ShoppingCart size={22} />
              <CartBadge count={cartCount} />
            </button>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-5 ml-auto shrink-0">
            <Link href="/profile" className="flex flex-col items-center text-[#1a1a1a] no-underline text-[11px] gap-0.5">
              <User size={22} />
              <span className="text-[#666]">Account</span>
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex flex-col items-center text-[#1a1a1a] text-[11px] gap-0.5 cursor-pointer"
              aria-label={cartLabel}
            >
              <span className="relative">
                <ShoppingCart size={22} />
                <CartBadge count={cartCount} />
              </span>
              <span className="text-[#666]">Bag</span>
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="md:hidden border-t border-[#e5e5e5] px-4 py-2.5 bg-white">
            <SearchForm
              id="mobile-search"
              className="flex h-10 border border-[#1a1a1a] rounded overflow-hidden"
              onDone={() => setSearchOpen(false)}
            />
          </div>
        )}
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {(cartOpen || mobileMenuOpen) && (
        <div
          onClick={() => {
            setCartOpen(false);
            setMobileMenuOpen(false);
          }}
          className="fixed inset-0 bg-black/50 z-[49]"
          aria-hidden
        />
      )}
    </>
  );
}
