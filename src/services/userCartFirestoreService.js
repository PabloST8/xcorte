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
    const payload = {
      items: Array.isArray(items) ? items : [],
      paymentMethod: paymentMethod || "card",
      updatedAt: serverTimestamp(),
    };
    await setDoc(cartDocRef(userId, enterpriseEmail), payload, { merge: true });
    return true;
  },
};
