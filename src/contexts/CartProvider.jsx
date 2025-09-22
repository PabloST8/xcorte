import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useEnterprise } from "./EnterpriseContext";
import { userCartFirestoreService } from "../services/userCartFirestoreService";
import { v4 as uuidv4 } from "uuid";
import { CartContext } from "./CartContext";
import { memoryStore } from "../services/memoryStore";
import { formatDateBR } from "../utils/dateUtils";

const STORAGE_KEY = "xcorte_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'pix' | 'cash'
  const { user, isAuthenticated } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const [loaded, setLoaded] = useState(false);

  console.log("🛒 [CartProvider] Renderizando com estado:", {
    itemsCount: items.length,
    isAuthenticated,
    user: user ? { uid: user.uid, email: user.email } : null,
    enterprise: currentEnterprise ? currentEnterprise.email : null,
    loaded,
  });

  const cartUserId = React.useMemo(() => {
    return user?.id || user?.uid || user?.email || null;
  }, [user]);

  // Load cart: prefer Firestore when logged in, else in-memory fallback (no localStorage)
  useEffect(() => {
    const load = async () => {
      console.log("🔍 [CartProvider] Iniciando carregamento do carrinho:", {
        isAuthenticated,
        cartUserId,
        enterpriseEmail: currentEnterprise?.email,
        loaded,
      });

      // Aguardar AuthContext e EnterpriseContext carregarem completamente
      if (!user && !loaded) {
        console.log("⏳ [CartProvider] Aguardando AuthContext carregar...");
        return; // Não carregar ainda
      }

      if (isAuthenticated && !currentEnterprise) {
        console.log(
          "⏳ [CartProvider] Aguardando EnterpriseContext carregar..."
        );
        return; // Não carregar ainda
      }

      try {
        // Try remote first when logged in
        if (isAuthenticated && cartUserId && currentEnterprise?.email) {
          console.log("🔍 [CartProvider] Tentando carregar do Firestore...");
          const remote = await userCartFirestoreService.getCart(
            cartUserId,
            currentEnterprise.email
          );
          console.log("🔍 [CartProvider] Resultado do Firestore:", remote);
          if (remote) {
            console.log(
              "✅ [CartProvider] Carrinho carregado do Firestore:",
              remote.items
            );
            setItems(remote.items || []);
            setPaymentMethod(remote.paymentMethod || "card");
            setLoaded(true);
            return; // remote loaded
          } else {
            console.log(
              "⚠️ [CartProvider] Nenhum carrinho encontrado no Firestore"
            );
          }
        } else {
          console.log("⚠️ [CartProvider] Não pode carregar do Firestore:", {
            isAuthenticated,
            cartUserId,
            enterpriseEmail: currentEnterprise?.email,
          });
        }

        // Fallback: in-memory session storage
        console.log("🔍 [CartProvider] Tentando carregar do memoryStore...");
        const raw = memoryStore.get(STORAGE_KEY);
        console.log("🔍 [CartProvider] Raw data do memoryStore:", raw);
        if (raw) {
          const parsed = JSON.parse(raw);
          console.log(
            "✅ [CartProvider] Carrinho carregado do memoryStore:",
            parsed
          );
          setItems(Array.isArray(parsed.items) ? parsed.items : []);
          if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        } else {
          console.log(
            "⚠️ [CartProvider] Nenhum carrinho encontrado no memoryStore"
          );
        }
        console.log("🔍 [CartProvider] Carregamento finalizado");
        setLoaded(true);
      } catch (e) {
        console.error("❌ [CartProvider] Falha ao carregar carrinho:", e);
        setLoaded(true);
      }
    };

    if (!loaded) {
      load();
    }
    // re-run when user or enterprise changes
  }, [
    isAuthenticated,
    cartUserId,
    currentEnterprise?.email,
    loaded,
    user,
    currentEnterprise,
  ]);

  useEffect(() => {
    const persist = async () => {
      try {
        if (!loaded) return; // avoid clearing before initial load
        if (isAuthenticated && cartUserId && currentEnterprise?.email) {
          console.log("🔄 Salvando carrinho no Firestore:", {
            isAuthenticated,
            cartUserId,
            enterpriseEmail: currentEnterprise.email,
            itemsCount: items.length,
          });
          await userCartFirestoreService.setCart(
            cartUserId,
            currentEnterprise.email,
            { items, paymentMethod }
          );
          console.log("✅ Carrinho salvo no Firestore com sucesso");
        } else {
          console.log("⚠️ Não salvando no Firestore:", {
            isAuthenticated,
            cartUserId,
            enterpriseEmail: currentEnterprise?.email,
            loaded,
          });
        }
        // Mirror to in-memory fallback (no persistence across reloads)
        memoryStore.set(STORAGE_KEY, JSON.stringify({ items, paymentMethod }));
      } catch (e) {
        console.warn("❌ Falha ao salvar carrinho:", e);
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
      console.log("🛒 Tentando adicionar item ao carrinho:", item);
      console.log("🛒 Estado atual do carrinho:", {
        itemsCount: items.length,
        isAuthenticated,
        cartUserId,
        enterpriseEmail: currentEnterprise?.email,
        loaded,
      });

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

      console.log("🛒 Item processado para adicionar:", newItem);

      // ⚠️ VERIFICAÇÃO DE DUPLICATAS NO CARRINHO ⚠️
      const hasDuplicate = items.some((existingItem) => {
        const sameEmployee =
          existingItem.employeeId &&
          newItem.employeeId &&
          String(existingItem.employeeId) === String(newItem.employeeId);
        const sameDate =
          existingItem.date &&
          newItem.date &&
          existingItem.date === newItem.date;
        const sameTime =
          existingItem.time &&
          newItem.time &&
          existingItem.time === newItem.time;

        const isDuplicate = sameEmployee && sameDate && sameTime;

        if (isDuplicate) {
          console.warn(
            "🚫 Tentativa de adicionar item duplicado ao carrinho:",
            {
              existing: {
                service: existingItem.serviceName,
                employee: existingItem.employeeName,
                date: existingItem.date,
                time: existingItem.time,
              },
              new: {
                service: newItem.serviceName,
                employee: newItem.employeeName,
                date: newItem.date,
                time: newItem.time,
              },
            }
          );
        }

        return isDuplicate;
      });

      if (hasDuplicate) {
        // Lançar erro que será capturado pelo componente que chama addItem
        const dateObj = new Date(`${newItem.date}T00:00:00`);
        const error = new Error(
          `Você já tem um agendamento com este profissional no horário ${
            newItem.time
          } do dia ${formatDateBR(
            dateObj
          )}. Escolha outro horário ou funcionário.`
        );
        error.type = "CART_DUPLICATE";
        throw error;
      }

      // debug
      console.debug("[Cart] addItem", newItem);
      console.log("🛒 Adicionando item ao estado...");
      setItems((prev) => {
        const next = [...prev, newItem];
        console.log("🛒 Novo estado do carrinho:", next);
        try {
          memoryStore.set(
            STORAGE_KEY,
            JSON.stringify({ items: next, paymentMethod })
          );
          console.log("🛒 Item salvo na memória com sucesso");
        } catch (e) {
          console.warn(
            "Falha ao salvar carrinho (fallback memória) no addItem:",
            e
          );
        }
        return next;
      });

      console.log("🛒 Item adicionado com sucesso!");
    },
    [
      paymentMethod,
      items,
      cartUserId,
      currentEnterprise?.email,
      isAuthenticated,
      loaded,
    ]
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
