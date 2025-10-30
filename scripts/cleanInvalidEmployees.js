/**
 * Script para limpar funcionários inválidos/corrompidos do Firestore
 *
 * Este script:
 * 1. Busca todos os funcionários da empresa pablofafstar@gmail.com
 * 2. Identifica funcionários com dados corrompidos/incompletos
 * 3. Remove os funcionários inválidos
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiq0CCQg7zvM1urGyV8mNLz6PV4z8sKak",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1089560106644",
  appId: "1:1089560106644:web:5fa8fc4bd7dba2fb01cbe9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ENTERPRISE_EMAIL = "pablofafstar@gmail.com";

async function cleanInvalidEmployees() {
  console.log("🧹 Iniciando limpeza de funcionários inválidos...\n");

  try {
    // Buscar todos os funcionários da empresa
    const employeesRef = collection(db, "employees");
    const q = query(
      employeesRef,
      where("enterpriseEmail", "==", ENTERPRISE_EMAIL)
    );
    const snapshot = await getDocs(q);

    console.log(`📊 Total de registros encontrados: ${snapshot.size}\n`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const empDoc of snapshot.docs) {
      const employee = empDoc.data();
      const employeeId = empDoc.id;

      // Verificar se o funcionário é válido
      const hasValidName =
        employee.name &&
        employee.name.trim() !== "" &&
        employee.name.length > 2 &&
        employee.name !== "Funcionário" &&
        employee.name !== "funcionário" &&
        employee.name !== "FUNCIONÁRIO" &&
        employee.name !== "Staff" &&
        employee.name !== "Employee";

      const hasValidEmail =
        employee.email &&
        employee.email.trim() !== "" &&
        employee.email.includes("@") &&
        employee.email.length < 50; // Email muito longo é suspeito

      const hasValidPosition =
        employee.position && employee.position.trim() !== "";

      const isValid = hasValidName && hasValidEmail && hasValidPosition;

      if (!isValid) {
        console.log(`❌ DELETANDO funcionário inválido:`);
        console.log(`   ID: ${employeeId}`);
        console.log(`   Nome: ${employee.name || "undefined"}`);
        console.log(`   Email: ${employee.email || "undefined"}`);
        console.log(`   Cargo: ${employee.position || "undefined"}`);
        console.log(`   Razões:`);
        if (!hasValidName) console.log(`     - Nome inválido`);
        if (!hasValidEmail) console.log(`     - Email inválido`);
        if (!hasValidPosition) console.log(`     - Cargo inválido`);
        console.log("");

        // Deletar o funcionário
        await deleteDoc(doc(db, "employees", employeeId));
        deletedCount++;
      } else {
        console.log(`✅ Mantendo funcionário válido:`);
        console.log(`   ID: ${employeeId}`);
        console.log(`   Nome: ${employee.name}`);
        console.log(`   Email: ${employee.email}`);
        console.log(`   Cargo: ${employee.position}`);
        console.log("");
        keptCount++;
      }
    }

    console.log("\n📊 RESUMO DA LIMPEZA:");
    console.log(`   ✅ Funcionários mantidos: ${keptCount}`);
    console.log(`   ❌ Funcionários deletados: ${deletedCount}`);
    console.log(`   📋 Total processado: ${snapshot.size}`);
    console.log("\n✨ Limpeza concluída com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro ao limpar funcionários:", error);
    throw error;
  }
}

// Executar o script
cleanInvalidEmployees()
  .then(() => {
    console.log("\n✅ Script finalizado!");
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
  });
