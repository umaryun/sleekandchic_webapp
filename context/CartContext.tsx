"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";
import { fetchCart, cartAction } from "@/lib/cart-api";

// ──────────────────────────────────────────────
// Context shape
// ──────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  addItem: (
    productId: string,
    variantId?: string | null,
    quantity?: number,
    details?: {
      productName?: string;
      unitPrice?: number;
      image?: string | null;
      size?: string | null;
      color?: string | null;
      productSlug?: string | null;
    }
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => Promise<void>;
  removeItem: (productId: string, variantId?: string | null) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ──────────────────────────────────────────────
// localStorage helpers
// ──────────────────────────────────────────────

const GUEST_TOKEN_KEY = "sc_guest_token";
const CART_CACHE_KEY = "sc_cart_cache";

function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_TOKEN_KEY);
}

function setGuestToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  }
}

function getCachedCart(): { items: CartItem[]; subtotal: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CART_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCachedCart(items: CartItem[], subtotal: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_CACHE_KEY, JSON.stringify({ items, subtotal }));
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Sync state + cache
  const syncState = useCallback(
    (newItems: CartItem[], newSubtotal: number, guestToken: string | null) => {
      setItems(newItems);
      setSubtotal(newSubtotal);
      setCachedCart(newItems, newSubtotal);
      if (guestToken) setGuestToken(guestToken);
    },
    []
  );

  // Initial load: cache first, then backend
  useEffect(() => {
    const cached = getCachedCart();
    if (cached) {
      setItems(cached.items);
      setSubtotal(cached.subtotal);
    }

    const token = getGuestToken();
    fetchCart(token)
      .then((data) => {
        syncState(data.items, data.subtotal, data.guestToken);
      })
      .catch((err) => {
        console.error("Cart fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, [syncState]);

  // ── Add item ──
  const addItem = useCallback(
    async (
      productId: string,
      variantId?: string | null,
      quantity = 1,
      details?: {
        productName?: string;
        unitPrice?: number;
        image?: string | null;
        size?: string | null;
        color?: string | null;
        productSlug?: string | null;
      }
    ) => {
      const currentReqId = ++requestIdRef.current;

      // Optimistic update
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) =>
            item.productId === productId &&
            (item.variantId || null) === (variantId || null)
        );

        let nextItems: CartItem[];
        if (existingIndex >= 0) {
          nextItems = prevItems.map((item, idx) => {
            if (idx !== existingIndex) return item;
            const newQty = item.quantity + quantity;
            return {
              ...item,
              quantity: newQty,
              total: item.unitPrice * newQty,
            };
          });
        } else {
          const unitPrice = details?.unitPrice || 0;
          const newItem: CartItem = {
            id: `temp-${Date.now()}`,
            productId,
            variantId: variantId || null,
            quantity,
            unitPrice,
            total: unitPrice * quantity,
            productName: details?.productName || "Product",
            productSlug: details?.productSlug || productId,
            productInStock: true,
            image: details?.image || null,
            size: details?.size || null,
            color: details?.color || null,
          };
          nextItems = [...prevItems, newItem];
        }

        const nextSubtotal = nextItems.reduce((sum, i) => sum + i.total, 0);
        setSubtotal(nextSubtotal);
        setCachedCart(nextItems, nextSubtotal);
        return nextItems;
      });

      try {
        const token = getGuestToken();
        const data = await cartAction("add", productId, token, variantId, quantity);
        if (currentReqId === requestIdRef.current) {
          syncState(data.items, data.subtotal, data.guestToken);
        }
      } catch (err) {
        console.error("Add to cart error:", err);
      }
    },
    [syncState]
  );

  // ── Update quantity ──
  const updateQuantity = useCallback(
    async (
      productId: string,
      variantId: string | null | undefined,
      quantity: number
    ) => {
      const currentReqId = ++requestIdRef.current;

      // Optimistic update
      setItems((prevItems) => {
        let nextItems: CartItem[];
        if (quantity <= 0) {
          nextItems = prevItems.filter(
            (item) =>
              !(
                item.productId === productId &&
                (item.variantId || null) === (variantId || null)
              )
          );
        } else {
          nextItems = prevItems.map((item) =>
            item.productId === productId &&
            (item.variantId || null) === (variantId || null)
              ? { ...item, quantity, total: item.unitPrice * quantity }
              : item
          );
        }

        const nextSubtotal = nextItems.reduce((sum, i) => sum + i.total, 0);
        setSubtotal(nextSubtotal);
        setCachedCart(nextItems, nextSubtotal);
        return nextItems;
      });

      try {
        const token = getGuestToken();
        const data = await cartAction("update", productId, token, variantId, quantity);
        if (currentReqId === requestIdRef.current) {
          syncState(data.items, data.subtotal, data.guestToken);
        }
      } catch (err) {
        console.error("Update cart error:", err);
        if (currentReqId === requestIdRef.current) {
          const token = getGuestToken();
          const data = await fetchCart(token);
          syncState(data.items, data.subtotal, data.guestToken);
        }
      }
    },
    [syncState]
  );

  // ── Remove item ──
  const removeItem = useCallback(
    async (productId: string, variantId?: string | null) => {
      const currentReqId = ++requestIdRef.current;

      // Optimistic remove
      setItems((prevItems) => {
        const nextItems = prevItems.filter(
          (item) =>
            !(
              item.productId === productId &&
              (item.variantId || null) === (variantId || null)
            )
        );
        const nextSubtotal = nextItems.reduce((sum, i) => sum + i.total, 0);
        setSubtotal(nextSubtotal);
        setCachedCart(nextItems, nextSubtotal);
        return nextItems;
      });

      try {
        const token = getGuestToken();
        const data = await cartAction("remove", productId, token, variantId);
        if (currentReqId === requestIdRef.current) {
          syncState(data.items, data.subtotal, data.guestToken);
        }
      } catch (err) {
        console.error("Remove from cart error:", err);
        if (currentReqId === requestIdRef.current) {
          const token = getGuestToken();
          const data = await fetchCart(token);
          syncState(data.items, data.subtotal, data.guestToken);
        }
      }
    },
    [syncState]
  );

  // ── Clear cart (local only — used after checkout) ──
  const clearCart = useCallback(() => {
    setItems([]);
    setSubtotal(0);
    setCachedCart([], 0);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
