import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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

    console.log("🔍 [userCartFirestore] Carregando carrinho do Firestore:", {
      userId,
      enterpriseEmail,
    });

    // Usar Firestore direto
    try {
      const snap = await getDoc(cartDocRef(userId, enterpriseEmail));
      if (!snap.exists()) {
        console.log(
          "📦 [userCartFirestore] Nenhum carrinho encontrado no Firestore"
        );
        return null;
      }
      const data = snap.data();
      console.log(
        "✅ [userCartFirestore] Carrinho carregado do Firestore:",
        data
      );
      return {
        items: Array.isArray(data.items) ? data.items : [],
        paymentMethod: data.paymentMethod || "card",
        updatedAt: data.updatedAt || null,
      };
    } catch (error) {
      console.error(
        "❌ [userCartFirestore] Erro ao carregar carrinho do Firestore:",
        error
      );
      return null;
    }
  },

  async setCart(userId, enterpriseEmail, { items, paymentMethod }) {
    if (!userId || !enterpriseEmail) return false;

    console.log("🔍 [userCartFirestore] Salvando carrinho no Firestore:", {
      userId,
      enterpriseEmail,
      itemsCount: items?.length,
    });

    const payload = {
      items: Array.isArray(items) ? items : [],
      paymentMethod: paymentMethod || "card",
      updatedAt: new Date().toISOString(),
    };

    // Usar Firestore direto
    try {
      await setDoc(
        cartDocRef(userId, enterpriseEmail),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(
        "✅ [userCartFirestore] Carrinho salvo no Firestore:",
        payload
      );
      return true;
    } catch (error) {
      console.error(
        "❌ [userCartFirestore] Erro ao salvar carrinho no Firestore:",
        error
      );
      return false;
    }
  },
};
