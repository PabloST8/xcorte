/**
 * Adicionar uma foto de teste real para o usuário Pablo
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQRWWzHyNB7rJk44IVaOQLp2E-U3JBLsQ",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:b83d29b5c8b7b77b7e6d4f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function adicionarFotoTeste() {
  console.log("📸 ADICIONANDO FOTO DE TESTE PARA O USUÁRIO");
  console.log("=".repeat(50));

  const userId = "88994464373";

  // URL de uma foto de teste válida do Firebase Storage
  const fotoURL =
    "https://firebasestorage.googleapis.com/v0/b/xcortes-e6f64.firebasestorage.app/o/user-photos%2F88994464373%2Ftest-photo.jpg?alt=media";
  const fotoPath = "user-photos/88994464373/test-photo.jpg";
  const version = Date.now();

  try {
    const ref = doc(db, "users", String(userId));

    console.log(`Salvando foto para usuário: ${userId}`);
    console.log(`URL: ${fotoURL}`);
    console.log(`Path: ${fotoPath}`);
    console.log(`Version: ${version}`);

    await updateDoc(ref, {
      photoURL: fotoURL,
      photoPath: fotoPath,
      photoVersion: version,
      photoUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Foto de teste adicionada com sucesso!");
    console.log("\n🔍 Agora teste a aplicação para ver se a foto aparece.");
    console.log(
      "Se aparecer, o problema está no processo de upload da aplicação."
    );
    console.log("Se não aparecer, o problema está na sincronização/leitura.");
  } catch (error) {
    console.error("❌ Erro ao adicionar foto de teste:", error);
  }
}

adicionarFotoTeste();
