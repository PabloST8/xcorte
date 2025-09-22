import { db, auth } from "./firebase";
import { memoryStore } from "./memoryStore";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Função para garantir que o usuário esteja autenticado no Firebase Auth
async function ensureFirebaseAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  // Para desenvolvimento: se login anônimo não estiver habilitado, usar fallback em memória
  console.log(
    "⚠️ Firebase Auth não disponível para carrinho. Usando fallback em memória para desenvolvimento."
  );
  return null; // Indicar que não há autenticação Firebase disponível
}

// Persist cart per user and enterprise
// Doc path: userCarts/{userId}/enterprises/{enterpriseEmail}
function cartDocRef(userId, enterpriseEmail) {
  return doc(
    db,
    "userCarts",
    String(userId),
    "enterprises",
    String(enterpriseEmail)
  );
}

export const userCartFirestoreService = {
  async getCart(userId, enterpriseEmail) {
    if (!userId || !enterpriseEmail) return null;

    // Tentar autenticação Firebase
    const firebaseUser = await ensureFirebaseAuth();

    // Se Firebase Auth não estiver disponível, usar fallback em memória
    if (!firebaseUser) {
      const localKey = `cart_${userId}_${enterpriseEmail}`;
      const stored = memoryStore.get(localKey);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          console.log("📦 Carrinho carregado do fallback em memória:", data);
          return {
            items: Array.isArray(data.items) ? data.items : [],
            paymentMethod: data.paymentMethod || "card",
            updatedAt: data.updatedAt || null,
          };
        } catch (e) {
          console.warn(
            "⚠️ Erro ao carregar carrinho do fallback em memória:",
            e
          );
          memoryStore.remove(localKey);
        }
      }
      return null;
    }

    // Usar Firestore se Firebase Auth estiver disponível
    try {
      const snap = await getDoc(cartDocRef(userId, enterpriseEmail));
      if (!snap.exists()) return null;
      const data = snap.data();
      console.log("📦 Carrinho carregado do Firestore:", data);
      return {
        items: Array.isArray(data.items) ? data.items : [],
        paymentMethod: data.paymentMethod || "card",
        updatedAt: data.updatedAt || null,
      };
    } catch (error) {
      console.error("❌ Erro ao carregar carrinho do Firestore:", error);
      return null;
    }
  },

  async setCart(userId, enterpriseEmail, { items, paymentMethod }) {
    if (!userId || !enterpriseEmail) return false;

    // Tentar autenticação Firebase
    const firebaseUser = await ensureFirebaseAuth();

    const payload = {
      items: Array.isArray(items) ? items : [],
      paymentMethod: paymentMethod || "card",
      updatedAt: new Date().toISOString(),
    };

    // Se Firebase Auth não estiver disponível, usar fallback em memória
    if (!firebaseUser) {
      const localKey = `cart_${userId}_${enterpriseEmail}`;
      try {
        memoryStore.set(localKey, JSON.stringify(payload));
        console.log("✅ Carrinho salvo no fallback em memória:", payload);
        return true;
      } catch (error) {
        console.error(
          "❌ Erro ao salvar carrinho no fallback em memória:",
          error
        );
        return false;
      }
    }

    // Usar Firestore se Firebase Auth estiver disponível
    try {
      await setDoc(
        cartDocRef(userId, enterpriseEmail),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("✅ Carrinho salvo no Firestore:", payload);
      return true;
    } catch (error) {
      console.error("❌ Erro ao salvar carrinho no Firestore:", error);
      return false;
    }
  },
};
