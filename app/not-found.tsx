import Link from "next/link";
import { Home, Search, ArrowRight, ShoppingBag, MessageCircle } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";

const QUICK_LINKS = [
  { label: "All products", href: "/products", Icon: ShoppingBag },
  { label: "Track an order", href: "/orders/tracking", Icon: Search },
  { label: "Contact us", href: "/contact", Icon: MessageCircle },
];

export default function NotFound() {
  return (
    <ShopLayout>
      <div className="flex min-h-[calc(100vh-300px)] flex-col items-center justify-center px-4 py-20 text-center">
        <p className="mb-6 select-none text-[clamp(100px,20vw,180px)] font-black leading-none tracking-tighter text-[#f0ebe6]" aria-hidden>
          404
        </p>
        <h1 className="mb-3 text-[28px] font-extrabold text-[#1a1a1a]">We couldn&apos;t find that page</h1>
        <p className="mb-9 max-w-[480px] text-[15px] leading-relaxed text-[#6b6b6b]">
          The link may be old, or the item may no longer be on sale.
        </p>

        <div className="mb-14 flex flex-wrap justify-center gap-3.5">
          <Link href="/" className="flex items-center gap-2 rounded bg-[#8a6452] px-7 py-3 text-sm font-bold text-white hover:bg-[#6f4f40]">
            <Home size={16} aria-hidden /> Home
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 rounded border-2 border-[#1a1a1a] px-7 py-3 text-sm font-bold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
          >
            <ShoppingBag size={16} aria-hidden /> Shop now
          </Link>
        </div>

        <nav aria-label="Helpful links" className="w-full max-w-[400px] border-t border-[#f0f0f0] pt-10">
          <ul>
            {QUICK_LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="flex w-full items-center gap-3 rounded-md px-5 py-3 text-sm font-medium text-[#555] hover:bg-[#f6efe9] hover:text-[#8a6452]"
                >
                  <Icon size={16} aria-hidden />
                  {label}
                  <ArrowRight size={14} className="ml-auto" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </ShopLayout>
  );
}
