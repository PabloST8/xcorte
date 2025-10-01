import { db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export const createAdminUser = async (
  email,
  enterpriseEmail,
  role = "admin",
  name = null
) => {
  try {
    console.log(`🔧 Criando usuário admin: ${email}`);

    // Gerar nome baseado no email se não fornecido
    const userName =
      name ||
      email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const userDoc = {
      email: email,
      name: userName, // Nome para exibição
      role: role, // 'admin' ou 'owner'
      status: "active",
      enterpriseEmail: enterpriseEmail, // Associar à empresa
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: {
        canManageAppointments: true,
        canManageServices: true,
        canManageStaff: true,
        canManageClients: true,
        canViewReports: true,
        canManageSettings: true,
      },
    };

    // Criar documento na coleção 'users'
    const userRef = doc(db, "users", email);
    await setDoc(userRef, userDoc, { merge: true });

    console.log("✅ Usuário admin criado com sucesso:", userDoc);
    return userDoc;
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
    throw error;
  }
};
