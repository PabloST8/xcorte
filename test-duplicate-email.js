// Script para testar validação de email duplicado
import { firestoreEnterpriseService } from "./src/services/firestoreEnterpriseService.js";

const testDuplicateEmail = async () => {
  console.log("🧪 INICIANDO TESTE DE EMAIL DUPLICADO");

  const testEmail = "barbeariamikael@gmail.com";
  const testEnterprise = {
    name: "Barbearia Mikael - Teste",
    email: testEmail,
    phone: "(11) 99999-9999",
    address: "Rua de Teste, 123",
    displayName: "Barbearia Mikael",
  };

  try {
    // Primeiro, verificar se o email já existe
    console.log("🔍 Verificando se email existe:", testEmail);
    const existing = await firestoreEnterpriseService.getEnterpriseByEmail(
      testEmail
    );
    console.log("📋 Empresa existente:", existing);

    // Tentar criar primeira empresa
    console.log("🏢 Tentando criar primeira empresa...");
    const firstAttempt = await firestoreEnterpriseService.createEnterprise(
      testEnterprise
    );
    console.log("✅ Primeira empresa criada:", firstAttempt);

    // Tentar criar segunda empresa com mesmo email (deve falhar)
    console.log("🏢 Tentando criar segunda empresa com mesmo email...");
    const secondAttempt = await firestoreEnterpriseService.createEnterprise({
      ...testEnterprise,
      name: "Barbearia Mikael - Duplicada",
    });
    console.log(
      "❌ ERRO: Segunda empresa criada (não deveria):",
      secondAttempt
    );
  } catch (error) {
    console.log("✅ SUCESSO: Erro capturado como esperado:", error.message);
  }

  console.log("🧪 TESTE FINALIZADO");
};

// Executar teste
testDuplicateEmail();
