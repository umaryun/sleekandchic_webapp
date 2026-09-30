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
import type { CartData, CartItem } from "@/types";
import { fetchCart, cartAction } from "@/lib/cart-api";

export type CartResult = { ok: true } | { ok: false; error: string };

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  /** Adds to the bag once the server confirms stock; resolves with the reason if it can't. */
  addItem: (productId: string, variantId?: string | null, quantity?: number) => Promise<CartResult>;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => Promise<CartResult>;
  removeItem: (productId: string, variantId?: string | null) => Promise<CartResult>;
  /** Reloads the bag from the server, e.g. after an order clears it. */
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const GUEST_TOKEN_KEY = "sc_guest_token";

function getGuestToken(): string | null {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setGuestToken(token: string | null) {
  try {
    if (token) localStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch {
    // Storage blocked (private mode): the bag lasts for this page only.
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "We couldn't update your bag. Please try again.";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Ignore responses from requests that a newer one has superseded.
  const requestIdRef = useRef(0);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const apply = useCallback((data: CartData) => {
    setItems(data.items);
    setSubtotal(data.subtotal);
    if (data.guestToken) setGuestToken(data.guestToken);
  }, []);

  const refresh = useCallback(async () => {
    const id = ++requestIdRef.current;
    try {
      const data = await fetchCart(getGuestToken());
      if (id === requestIdRef.current) apply(data);
    } catch (err) {
      console.error("Cart fetch error:", err);
    }
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    fetchCart(getGuestToken())
      .then((data) => {
        if (!cancelled) apply(data);
      })
      .catch((err) => console.error("Cart fetch error:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const addItem = useCallback(
    async (productId: string, variantId?: string | null, quantity = 1): Promise<CartResult> => {
      const id = ++requestIdRef.current;
      try {
        const data = await cartAction("add", productId, getGuestToken(), variantId, quantity);
        if (id === requestIdRef.current) apply(data);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: errorMessage(err) };
      }
    },
    [apply]
  );

  const change = useCallback(
    async (
      action: "update" | "remove",
      productId: string,
      variantId: string | null | undefined,
      quantity?: number
    ): Promise<CartResult> => {
      const id = ++requestIdRef.current;
      const sameLine = (item: CartItem) =>
        item.productId === productId && (item.variantId || null) === (variantId || null);

      // Show the change straight away; the server's answer replaces it.
      setItems((prev) => {
        const next =
          action === "remove" || quantity === 0
            ? prev.filter((item) => !sameLine(item))
            : prev.map((item) =>
                sameLine(item) ? { ...item, quantity: quantity!, total: item.unitPrice * quantity! } : item
              );
        setSubtotal(next.reduce((sum, i) => sum + i.total, 0));
        return next;
      });

      try {
        const data = await cartAction(action, productId, getGuestToken(), variantId, quantity);
        if (id === requestIdRef.current) apply(data);
        return { ok: true };
      } catch (err) {
        // Put back what the server actually has.
        await refresh();
        return { ok: false, error: errorMessage(err) };
      }
    },
    [apply, refresh]
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null | undefined, quantity: number) =>
      change("update", productId, variantId, quantity),
    [change]
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string | null) => change("remove", productId, variantId),
    [change]
  );

  return (
    <CartContext.Provider
      value={{ items, cartCount, subtotal, loading, addItem, updateQuantity, removeItem, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
