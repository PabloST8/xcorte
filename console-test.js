// Teste de validação de email duplicado
// Cole este código no console do navegador na página do SuperAdmin

const testDuplicateEmailValidation = async () => {
  console.log("🧪 TESTE DE VALIDAÇÃO DE EMAIL DUPLICADO");

  // Simular dados de teste
  const testEmail = "barbeariamikael@gmail.com";
  const testData = {
    name: "Barbearia Mikael Teste",
    email: testEmail,
    phone: "(11) 99999-9999",
    address: "Rua de Teste, 123",
    displayName: "Barbearia Mikael",
  };

  try {
    // Acessar o serviço através do window object ou importar se disponível
    console.log("📝 Dados de teste:", testData);

    // Primeiro teste: verificar se já existe
    console.log("🔍 Verificando se email já existe...");

    // Se estiver na página do SuperAdmin, pode usar o contexto
    console.log(
      "💡 Para testar, vá ao formulário 'Nova Empresa' e tente criar com email:",
      testEmail
    );
    console.log(
      "💡 Se já existe uma empresa com este email, deve aparecer erro!"
    );
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
};

// Executar teste
testDuplicateEmailValidation();
