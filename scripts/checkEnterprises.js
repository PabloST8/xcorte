// Script para verificar empresas no Firestore
import { db } from "../src/services/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function checkEnterprises() {
  try {
    console.log("Verificando empresas no Firestore...");
    const snap = await getDocs(collection(db, "enterprises"));

    if (snap.empty) {
      console.log("❌ Nenhuma empresa encontrada no Firestore");
      return;
    }

    console.log(`✅ Encontradas ${snap.docs.length} empresas:`);
    snap.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Nome: ${data.name || "N/A"}`);
      console.log(`   Email: ${data.email || "N/A"}`);
      console.log(`   ---`);
    });
  } catch (error) {
    console.error("❌ Erro ao verificar empresas:", error);
  }
}

checkEnterprises();
