import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useEnterprise } from "./EnterpriseContext";
import { userCartFirestoreService } from "../services/userCartFirestoreService";
import { v4 as uuidv4 } from "uuid";
import { CartContext } from "./CartContext";

const STORAGE_KEY = "xcorte_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'pix' | 'cash'
  const { user, isAuthenticated } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const [loaded, setLoaded] = useState(false);

  const cartUserId = React.useMemo(() => {
    return user?.id || user?.uid || user?.email || null;
  }, [user]);

  // Load cart: prefer Firestore when logged in, else localStorage
  useEffect(() => {
    const load = async () => {
      try {
        // Try remote first when logged in
        if (isAuthenticated && cartUserId && currentEnterprise?.email) {
          const remote = await userCartFirestoreService.getCart(
            cartUserId,
            currentEnterprise.email
          );
          if (remote) {
            setItems(remote.items || []);
            setPaymentMethod(remote.paymentMethod || "card");
            setLoaded(true);
            return; // remote loaded
          }
        }
        // Fallback local
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setItems(Array.isArray(parsed.items) ? parsed.items : []);
          if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        }
        setLoaded(true);
      } catch (e) {
        console.warn("Falha ao carregar carrinho:", e);
        setLoaded(true);
      }
    };
    load();
    // re-run when user or enterprise changes
  }, [isAuthenticated, cartUserId, currentEnterprise?.email]);

  useEffect(() => {
    const persist = async () => {
      try {
        if (!loaded) return; // avoid clearing before initial load
        if (isAuthenticated && cartUserId && currentEnterprise?.email) {
          await userCartFirestoreService.setCart(
            cartUserId,
            currentEnterprise.email,
            { items, paymentMethod }
          );
        }
        // Always mirror to local as cache/fallback
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ items, paymentMethod })
        );
      } catch (e) {
        console.warn("Falha ao salvar carrinho:", e);
      }
    };
    persist();
  }, [
    items,
    paymentMethod,
    isAuthenticated,
    cartUserId,
    currentEnterprise?.email,
    loaded,
  ]);

  const addItem = useCallback(
    (item) => {
      const id = item.id || uuidv4();
      const newItem = {
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
      };
      // debug
      console.debug("[Cart] addItem", newItem);
      setItems((prev) => {
        const next = [...prev, newItem];
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ items: next, paymentMethod })
          );
        } catch (e) {
          console.warn("Falha ao salvar carrinho no addItem:", e);
        }
        return next;
      });
    },
    [paymentMethod]
  );

  const removeItem = useCallback(
    (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    []
  );
  const updateItem = useCallback(
    (id, partial) =>
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...partial } : i))
      ),
    []
  );
  const clear = useCallback(() => setItems([]), []);

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
    [items, addItem, removeItem, updateItem, clear, paymentMethod]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
