// Script para criar usuário admin no Firebase
// Execute este arquivo no console do navegador para criar um usuário admin no Firestore
// Ou use este código como base para criar via interface administrativa

import { db } from "./src/services/firebase.js";
import { doc, setDoc } from "firebase/firestore";

const createAdminUser = async () => {
  try {
    const adminData = {
      email: "empresaadmin@xcortes.com",
      name: "Administrador XCortes",
      role: "admin",
      status: "active",
      enterpriseEmail: "test@empresa.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: {
        dashboard: true,
        appointments: true,
        clients: true,
        services: true,
        staff: true,
      },
    };

    // Criar documento do usuário admin (usando email como ID)
    await setDoc(doc(db, "users", "empresaadmin@xcortes.com"), adminData);

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("📧 Email: empresaadmin@xcortes.com");
    console.log("🔐 Configure a senha no Firebase Authentication Console");

    return adminData;
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
    throw error;
  }
};

// Exportar função para uso
export { createAdminUser };

// Instruções de uso:
console.log(`
🚀 Para criar usuário admin:

1. Abra o console do navegador em sua aplicação
2. Execute: createAdminUser()
3. Vá ao Firebase Console > Authentication
4. Adicione o usuário com email: empresaadmin@xcortes.com
5. Defina a senha: admin123
6. Pronto! Agora pode fazer login como admin

Ou execute este script diretamente no ambiente Node.js
`);
