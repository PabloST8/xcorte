// Script simples para verificar empresas
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Tenta usar as credenciais se disponíveis
let app;
try {
  // Tenta inicializar com as credenciais padrão
  app = admin.initializeApp({
    projectId: "xcortes-e6f64",
  });
} catch (error) {
  console.log("Usando credenciais de aplicação padrão");
}

const db = admin.firestore();

async function checkEnterprises() {
  try {
    console.log("🔍 Verificando empresas no Firestore...");
    const snapshot = await db.collection("enterprises").get();

    if (snapshot.empty) {
      console.log("❌ Nenhuma empresa encontrada no Firestore");
      return;
    }

    console.log(`✅ Encontradas ${snapshot.docs.length} empresas:`);
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Nome: ${data.name || "N/A"}`);
      console.log(`   Email: ${data.email || "N/A"}`);
      console.log(`   ---`);
    });
  } catch (error) {
    console.error("❌ Erro ao verificar empresas:", error);
    console.log("Pode ser necessário configurar credenciais de administrador");
  }
}

checkEnterprises();
