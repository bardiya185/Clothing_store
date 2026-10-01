import { api } from "./api";
import { normalizeProduct, type ApiProduct } from "./catalog.service";
import type { Product } from "@/lib/product";

const SESSION_KEY = "baran-cart-session";

export type CartDiscount = {
  code: string;
  discount_toman: number;
  discount_usd: number;
};

type ApiCartItem = {
  id: number;
  variant_id: number;
  product_id: number;
  sku: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  unit_price_toman: number;
  unit_price_usd: number;
  total_toman: number;
  total_usd: number;
  product: ApiProduct;
};

type ApiCart = {
  id: number;
  session_id: string;
  count: number;
  total_quantity: number;
  discount_code?: string | null;
  discount: CartDiscount | null;
  subtotal_toman: number;
  subtotal_usd: number;
  total_toman: number;
  total_usd: number;
  items: ApiCartItem[];
};

export type CartItem = {
  id: number;
  product: Product;
  variantId: number;
  quantity: number;
  size: string;
  color: string;
  unitPriceToman: number;
  unitPriceUsd: number;
  totalToman: number;
  totalUsd: number;
};

export type CartSnapshot = {
  id: number;
  sessionId: string;
  count: number;
  totalQuantity: number;
  discount: CartDiscount | null;
  subtotalToman: number;
  subtotalUsd: number;
  totalToman: number;
  totalUsd: number;
  items: CartItem[];
};

function sessionHeaders() {
  if (typeof window === "undefined") return {};
  const sessionId = window.localStorage.getItem(SESSION_KEY);
  return sessionId ? { "X-Cart-Session": sessionId } : {};
}

function normalizeCart(cart: ApiCart): CartSnapshot {
  if (typeof window !== "undefined" && cart.session_id) {
    window.localStorage.setItem(SESSION_KEY, cart.session_id);
  }

  return {
    id: cart.id,
    sessionId: cart.session_id,
    count: cart.count,
    totalQuantity: cart.total_quantity,
    discount: cart.discount,
    subtotalToman: cart.subtotal_toman,
    subtotalUsd: cart.subtotal_usd,
    totalToman: cart.total_toman,
    totalUsd: cart.total_usd,
    items: cart.items.map((item) => ({
      id: item.id,
      product: normalizeProduct(item.product),
      variantId: item.variant_id,
      quantity: item.quantity,
      size: item.size ?? "",
      color: item.color ?? "",
      unitPriceToman: item.unit_price_toman,
      unitPriceUsd: item.unit_price_usd,
      totalToman: item.total_toman,
      totalUsd: item.total_usd,
    })),
  };
}

export async function getCart() {
  const response = await api.get<{ data: ApiCart }>("/cart", {
    headers: sessionHeaders(),
  });
  return normalizeCart(response.data.data);
}

export async function addCartItem(variantId: number, quantity: number) {
  const response = await api.post<{ data: ApiCart }>(
    "/cart/items",
    { variant_id: variantId, quantity },
    { headers: sessionHeaders() },
  );
  return normalizeCart(response.data.data);
}

export async function updateCartItem(variantId: number, quantity: number) {
  const response = await api.patch<{ data: ApiCart }>(
    `/cart/items/${variantId}`,
    { quantity },
    { headers: sessionHeaders() },
  );
  return normalizeCart(response.data.data);
}

export async function removeCartItem(variantId: number) {
  const response = await api.delete<{ data: ApiCart }>(
    `/cart/items/${variantId}`,
    { headers: sessionHeaders() },
  );
  return normalizeCart(response.data.data);
}

export async function clearCart() {
  const response = await api.delete<{ data: ApiCart }>("/cart", {
    headers: sessionHeaders(),
  });
  return normalizeCart(response.data.data);
}

export async function applyCartDiscount(code: string | null) {
  const response = await api.patch<{ data: ApiCart }>(
    "/cart/discount",
    { code },
    { headers: sessionHeaders() },
  );
  return normalizeCart(response.data.data);
}
