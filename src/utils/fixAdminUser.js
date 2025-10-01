import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const fixAdminUser = async () => {
  try {
    console.log("🔧 Corrigindo usuário admin barbeariamikael@gmail.com...");

    // Atualizar o documento do usuário para garantir que tem enterpriseEmail
    const userRef = doc(db, "users", "barbeariamikael@gmail.com");
    await updateDoc(userRef, {
      enterpriseEmail: "barbeariamikael@gmail.com",
      name: "Admin Mikael", // Nome do usuário admin
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Usuário admin atualizado com enterpriseEmail");
    return true;
  } catch (error) {
    console.error("❌ Erro ao corrigir usuário admin:", error);
    throw error;
  }
};
