import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const CreateSuperAdminButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const createSuperAdmin = async () => {
    if (loading) return;

    setLoading(true);
    setMessage("");

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
      setMessage(
        `✅ Super Admin criado com sucesso!\n📧 Email: ${email}\n🔑 Senha: ${password}\n⚠️ ALTERE A SENHA APÓS O PRIMEIRO LOGIN!`
      );
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setMessage("ℹ️ Email já existe. Use o login normal.");
      } else {
        console.error("❌ Erro ao criar Super Admin:", error);
        setMessage(`❌ Erro: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-bold text-sm mb-2">Criar Super Admin</h3>
      <button
        onClick={createSuperAdmin}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Criando..." : "Criar Usuario Admin"}
      </button>
      {message && (
        <div className="mt-2 text-xs whitespace-pre-line text-gray-700 bg-gray-50 p-2 rounded">
          {message}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Use apenas uma vez para criar usuário inicial
      </p>
    </div>
  );
};

export default CreateSuperAdminButton;
