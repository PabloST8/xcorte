import React, { useMemo, useState, useEffect } from "react";
import { CartContext } from "./CartContext";
import { memoryStore } from "../services/memoryStore";
const STORAGE_KEY = "xcorte_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    try {
      const raw = memoryStore.get(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed.items) ? parsed.items : []);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      }
    } catch (e) {
      console.warn("Falha ao carregar carrinho do storage:", e);
    }
  }, []);

  useEffect(() => {
    try {
      memoryStore.set(STORAGE_KEY, JSON.stringify({ items, paymentMethod }));
    } catch (e) {
      console.warn("Falha ao salvar carrinho no storage:", e);
    }
  }, [items, paymentMethod]);

  const addItem = (item) => {
    const id =
      item.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        productId: String(item.productId || ""),
        serviceName: item.serviceName || item.service || "",
        priceInCents: Number(item.priceInCents ?? item.price ?? 0),
        duration: Number(item.duration ?? item.productDuration ?? 30),
        employeeId: item.employeeId ? String(item.employeeId) : "",
        employeeName: item.employeeName || item.staff || "",
        date: item.date || "",
        time: item.time || item.startTime || "",
        notes: item.notes || "",
      },
    ]);
  };

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id, partial) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...partial } : i))
    );
  const clear = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateItem,
      clear,
      paymentMethod,
      setPaymentMethod,
    }),
    [items, paymentMethod]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
