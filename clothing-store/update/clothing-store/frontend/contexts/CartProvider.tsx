"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/product";
import { getApiErrorMessage } from "@/lib/api-error";
import { useLocale } from "@/hooks/useLocale";
import { useCurrentUser } from "@/hooks/useAccount";
import {
  addCartItem,
  applyCartDiscount,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartDiscount,
  type CartItem,
} from "@/services/cart.service";

type CartContextValue = {
  items: CartItem[];
  count: number;
  totalQuantity: number;
  discount: CartDiscount | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (
    product: Product,
    options?: { variantId?: number; size?: string; color?: string; quantity?: number },
  ) => Promise<boolean>;
  removeItem: (productId: number, variantId: number) => Promise<boolean>;
  updateQuantity: (
    productId: number,
    variantId: number,
    quantity: number,
  ) => Promise<boolean>;
  clear: () => Promise<boolean>;
  applyDiscount: (code: string) => Promise<boolean>;
  clearDiscount: () => Promise<boolean>;
};

export const CartContext = createContext<CartContextValue | null>(null);

function defaultVariant(product: Product) {
  const variant = product.variants?.[0];
  return {
    variantId: variant?.id ?? 0,
    size: variant?.attributes.find((item) => item.slug === "size")?.value ?? "",
    color: variant?.attributes.find((item) => item.slug === "color")?.value ?? "",
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const { data: user } = useCurrentUser();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getCart>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSyncKey = useRef<string | null>(null);
  const inFlightSyncKey = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setSnapshot(await getCart());
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          locale === "fa" ? "دریافت سبد خرید ناموفق بود." : "Could not load your bag.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  const cartSyncKey = `${user?.id ?? "guest"}:${locale}`;

  useEffect(() => {
    if (lastSyncKey.current === cartSyncKey || inFlightSyncKey.current === cartSyncKey) {
      return;
    }

    inFlightSyncKey.current = cartSyncKey;
    window.localStorage.removeItem("baran-cart");
    window.localStorage.removeItem("baran-discount");
    void refresh().finally(() => {
      inFlightSyncKey.current = null;
      lastSyncKey.current = cartSyncKey;
    });
  }, [cartSyncKey, refresh]);

  const updateSnapshot = useCallback(async (
    action: () => Promise<Awaited<ReturnType<typeof getCart>>>,
    successMessage?: string,
  ) => {
    try {
      setError(null);
      setSnapshot(await action());
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        locale === "fa" ? "به‌روزرسانی سبد خرید ناموفق بود." : "Could not update your bag.",
      );
      setError(message);
      toast.error(message);
      return false;
    }
  }, [locale]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: snapshot?.items ?? [],
      count: snapshot?.count ?? 0,
      totalQuantity: snapshot?.totalQuantity ?? 0,
      discount: snapshot?.discount ?? null,
      isLoading,
      error,
      refresh,
      addItem: async (product, options = {}) => {
        const defaults = defaultVariant(product);
        const variantId = options.variantId ?? defaults.variantId;
        return updateSnapshot(() => addCartItem(variantId, options.quantity ?? 1));
      },
      removeItem: async (_productId, variantId) => updateSnapshot(() => removeCartItem(variantId)),
      updateQuantity: async (_productId, variantId, quantity) =>
        updateSnapshot(() => updateCartItem(variantId, quantity)),
      clear: async () => updateSnapshot(() => clearCart()),
      applyDiscount: async (code) => updateSnapshot(() => applyCartDiscount(code)),
      clearDiscount: async () => updateSnapshot(() => applyCartDiscount(null)),
    }),
    [error, isLoading, refresh, snapshot, updateSnapshot],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
