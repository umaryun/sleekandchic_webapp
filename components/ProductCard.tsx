"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Eye, Check } from "lucide-react";
import type { Product } from "@/types";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

const badgeColors: Record<string, { bg: string; color: string }> = {
  sale: { bg: "#b88d7a", color: "#fff" },
  new: { bg: "#5a8a6a", color: "#fff" },
  hot: { bg: "#c45b5b", color: "#fff" },
};

const buttonClass =
  "flex-1 flex items-center justify-center gap-2 py-2 rounded-[5px] text-xs font-semibold border-[1.5px] transition-colors";

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [error, setError] = useState<string | null>(null);
  const href = `/products/${product.slug}`;

  // Sizes and colours are chosen on the product page; the card only adds
  // directly when there's nothing to choose.
  const handleAdd = async () => {
    setError(null);
    setState("adding");
    const result = await addItem(product.id, product.singleVariantId ?? null, 1);
    if (result.ok) {
      setState("added");
      setTimeout(() => setState("idle"), 1500);
    } else {
      setState("idle");
      setError(result.error);
    }
  };

  return (
    <div className="bg-white rounded-[5px] overflow-hidden relative flex flex-col">
      {product.soldOut ? (
        <div className="absolute top-3 left-3 z-[2] bg-[#1a1a1a] text-white text-[10px] font-bold px-2.5 py-[3px] rounded-[5px] uppercase tracking-[0.5px]">
          Sold out
        </div>
      ) : (
        product.badge && (
          <div
            className="absolute top-3 left-3 z-[2] text-[10px] font-bold px-2.5 py-[3px] rounded-[5px] uppercase tracking-[0.5px]"
            style={{ background: badgeColors[product.badge].bg, color: badgeColors[product.badge].color }}
          >
            {product.badge === "sale" && product.discount ? `-${product.discount}%` : product.badge}
          </div>
        )
      )}

      <Link href={href}>
        <div className="relative pt-[100%] overflow-hidden bg-[#faf9f8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/placeholder-product.svg"}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover ${product.soldOut ? "opacity-60" : ""}`}
          />
        </div>
      </Link>

      <div className="px-4 pt-2.5 pb-1.5 flex flex-col flex-1">
        <Link href={href} className="no-underline">
          <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-2.5 leading-[1.45] line-clamp-2 hover:text-[#b88d7a] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[17px] font-bold text-[#b88d7a]">{formatNGN(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-[#aaa] line-through">{formatNGN(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <div className="px-3.5 pt-2 pb-3.5 flex gap-2">
        {product.soldOut ? (
          <span className={`${buttonClass} border-[#e0e0e0] text-[#999] cursor-not-allowed`}>Sold out</span>
        ) : product.hasOptions ? (
          <Link
            href={href}
            className={`${buttonClass} bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-white hover:text-[#1a1a1a] no-underline`}
          >
            Choose size
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={state === "adding"}
            className={`${buttonClass} cursor-pointer ${
              state === "added"
                ? "bg-[#5a8a6a] text-white border-[#5a8a6a]"
                : "bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-white hover:text-[#1a1a1a]"
            } disabled:opacity-70`}
          >
            {state === "added" ? <Check size={14} /> : <ShoppingCart size={14} />}
            {state === "adding" ? "Adding…" : state === "added" ? "Added" : "Add to Cart"}
          </button>
        )}
        <Link
          href={href}
          title="View product"
          aria-label={`View ${product.name}`}
          className="w-[38px] shrink-0 flex items-center justify-center rounded-[5px] border-[1.5px] border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
        >
          <Eye size={15} />
        </Link>
      </div>

      {error && (
        <p role="alert" className="px-3.5 pb-3 -mt-1.5 text-xs text-[#c45b5b]">
          {error}
        </p>
      )}
    </div>
  );
}
