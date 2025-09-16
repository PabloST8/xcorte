// Script para criar usuário Super Admin
// Execute este script uma vez para criar o usuário administrativo

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../src/services/firebase.js";

const createSuperAdminUser = async () => {
  try {
    console.log("🔧 Criando usuário Super Admin...");

    const email = "pablofafstar@gmail.com";
    const password = "admin123"; // ALTERE ESTA SENHA!

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    console.log("✅ Usuário criado no Auth:", user.uid);

    // Criar documento no Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "super_admin",
      name: "Super Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Documento do usuário criado no Firestore");
    console.log("🎉 Super Admin criado com sucesso!");
    console.log("📧 Email:", email);
    console.log("🔑 Senha:", password);
    console.log("⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!");
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log("ℹ️  Email já existe, tentando apenas atualizar role...");

      // Se o usuário já existe, apenas garantir que tem role de super_admin
      try {
        const user = auth.currentUser;
        if (user && user.email === "pablofafstar@gmail.com") {
          await setDoc(
            doc(db, "users", user.uid),
            {
              email: user.email,
              role: "super_admin",
              name: "Super Admin",
              updatedAt: new Date(),
            },
            { merge: true }
          );

          console.log("✅ Role atualizado para super_admin");
        }
      } catch (updateError) {
        console.error("❌ Erro ao atualizar role:", updateError);
      }
    } else {
      console.error("❌ Erro ao criar Super Admin:", error);
    }
  }
};

// Exportar para uso como módulo ou executar diretamente
if (typeof window === "undefined") {
  // Node.js environment
  createSuperAdminUser();
} else {
  // Browser environment
  window.createSuperAdminUser = createSuperAdminUser;
}

export { createSuperAdminUser };
