import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQty: (productId: string, variantId: string | null, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  total: 0,
  count: 0,
});

function getKey(productId: string, variantId: string | null) {
  return `${productId}__${variantId ?? "none"}`;
}

const STORAGE_KEY = "vb_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const key = getKey(item.productId, item.variantId);
      const existing = prev.find((i) => getKey(i.productId, i.variantId) === key);
      if (existing) {
        return prev.map((i) =>
          getKey(i.productId, i.variantId) === key
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }

  function removeItem(productId: string, variantId: string | null) {
    const key = getKey(productId, variantId);
    setItems((prev) => prev.filter((i) => getKey(i.productId, i.variantId) !== key));
  }

  function updateQty(productId: string, variantId: string | null, qty: number) {
    const key = getKey(productId, variantId);
    if (qty <= 0) { removeItem(productId, variantId); return; }
    setItems((prev) =>
      prev.map((i) => getKey(i.productId, i.variantId) === key ? { ...i, quantity: qty } : i)
    );
  }

  function clearCart() { setItems([]); }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
