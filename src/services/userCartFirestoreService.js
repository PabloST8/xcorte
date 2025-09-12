import { db, auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Função para garantir que o usuário esteja autenticado no Firebase Auth
async function ensureFirebaseAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  
  console.log("🔄 Tentando autenticar no Firebase Auth para operação de carrinho...");
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("✅ Autenticado no Firebase Auth:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("❌ Erro ao autenticar no Firebase Auth:", error);
    throw new Error("Falha na autenticação. Tente novamente.");
  }
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
    
    // Garantir que o usuário esteja autenticado no Firebase Auth
    try {
      await ensureFirebaseAuth();
    } catch (error) {
      console.warn("⚠️ Erro ao autenticar para carregar carrinho:", error);
      return null;
    }
    
    const snap = await getDoc(cartDocRef(userId, enterpriseEmail));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      items: Array.isArray(data.items) ? data.items : [],
      paymentMethod: data.paymentMethod || "card",
      updatedAt: data.updatedAt || null,
    };
  },

  async setCart(userId, enterpriseEmail, { items, paymentMethod }) {
    if (!userId || !enterpriseEmail) return false;
    
    // Garantir que o usuário esteja autenticado no Firebase Auth
    try {
      await ensureFirebaseAuth();
    } catch (error) {
      console.warn("⚠️ Erro ao autenticar para salvar carrinho:", error);
      return false;
    }
    
    const payload = {
      items: Array.isArray(items) ? items : [],
      paymentMethod: paymentMethod || "card",
      updatedAt: serverTimestamp(),
    };
    
    console.log("🔄 Tentando salvar carrinho:", { 
      userId, 
      enterpriseEmail,
      authUser: auth.currentUser?.uid,
      itemsCount: payload.items.length 
    });
    
    await setDoc(cartDocRef(userId, enterpriseEmail), payload, { merge: true });
    console.log("✅ Carrinho salvo com sucesso");
    return true;
  },
};
