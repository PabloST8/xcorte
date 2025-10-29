/**
 * Script para fazer upload de uma foto real de teste
 */

import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Buffer } from "buffer";

// Configurações da aplicação
const firebaseConfig = {
  apiKey: "AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:f6ee67ab1ffbdb333d4bd5",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

async function uploadFotoTeste() {
  console.log("📤 FAZENDO UPLOAD DE FOTO REAL DE TESTE");
  console.log("=".repeat(50));

  try {
    // 1. Autenticar anonimamente (necessário para upload)
    console.log("🔐 Autenticando anonimamente...");
    await signInAnonymously(auth);
    console.log("✅ Autenticado com sucesso");

    // 2. Criar uma imagem simples em base64 (1x1 pixel PNG)
    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFD6h8EZwAAAABJRU5ErkJggg==";
    const imageBuffer = Buffer.from(base64Image, "base64");

    // 3. Definir path e criar referência
    const userId = "88994464373";
    const fileName = `test-photo-${Date.now()}.png`;
    const filePath = `user-photos/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    console.log(`📁 Fazendo upload para: ${filePath}`);

    // 4. Upload do arquivo
    const metadata = {
      contentType: "image/png",
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString(),
      },
    };

    const snapshot = await uploadBytes(storageRef, imageBuffer, metadata);
    console.log("✅ Upload concluído");

    // 5. Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("🔗 URL gerada:", downloadURL);

    // 6. Salvar metadados no Firestore
    console.log("💾 Salvando metadados no Firestore...");
    const userRef = doc(db, "users", String(userId));
    const version = Date.now();

    await updateDoc(userRef, {
      photoURL: downloadURL,
      photoPath: filePath,
      photoVersion: version,
      photoUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Metadados salvos no Firestore");

    // 7. Testar a URL
    console.log("\n🧪 Testando acesso à URL...");
    const response = await fetch(downloadURL, { method: "HEAD" });
    console.log("Status:", response.status);

    if (response.ok) {
      console.log("✅ Foto acessível com sucesso!");
      console.log(
        "\n🎉 TESTE COMPLETO! Agora a aplicação deve mostrar a foto."
      );
    } else {
      console.log("❌ Foto não acessível");
    }
  } catch (error) {
    console.error("❌ Erro no upload:", error);
    console.error("Código:", error.code);
    console.error("Mensagem:", error.message);
  }
}

uploadFotoTeste();
