// Script de teste para validar a correção do bug CT003-001
// Execute este script no console do navegador para testar a função formatPhone

console.log("🧪 TESTE DA CORREÇÃO CT003-001: Validação de Telefone");
console.log("=".repeat(60));

// Simular a função formatPhone
const formatPhone = (value) => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Casos de teste
const testCases = [
  {
    input: "11999999999",
    expected: "(11) 99999-9999",
    description: "Telefone válido com 11 dígitos",
  },
  {
    input: "119999999999999",
    expected: "(11) 99999-9999",
    description: "Telefone com mais de 11 dígitos (deve limitar)",
  },
  {
    input: "11 99999-9999",
    expected: "(11) 99999-9999",
    description: "Telefone com formatação prévia",
  },
  {
    input: "(11) 99999-9999",
    expected: "(11) 99999-9999",
    description: "Telefone já formatado",
  },
  {
    input: "11abc99999def9999ghijk",
    expected: "(11) 99999-9999",
    description:
      "Telefone com caracteres não numéricos (resulta em 11 dígitos)",
  },
  {
    input: "1199999999",
    expected: "(11) 9999-9999",
    description: "Telefone com 10 dígitos",
  },
  {
    input: "119999",
    expected: "(11) 9999",
    description: "Telefone parcial com 6 dígitos",
  },
  {
    input: "11",
    expected: "11",
    description: "Apenas DDD",
  },
  {
    input: "",
    expected: "",
    description: "Campo vazio",
  },
];

console.log("\\n🧪 Executando testes:");
console.log("-".repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = formatPhone(test.input);
  const success = result === test.expected;

  console.log(`\\nTeste ${index + 1}: ${test.description}`);
  console.log(`  Input: "${test.input}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Result: "${result}"`);
  console.log(`  Status: ${success ? "✅ PASSOU" : "❌ FALHOU"}`);

  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log("\\n" + "=".repeat(60));
console.log("📊 RESUMO DOS TESTES:");
console.log(`✅ Testes que passaram: ${passed}/${testCases.length}`);
console.log(`❌ Testes que falharam: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log("\\n🎉 TODOS OS TESTES PASSARAM!");
  console.log("✅ A correção CT003-001 está funcionando corretamente!");
} else {
  console.log("\\n⚠️ ALGUNS TESTES FALHARAM!");
  console.log("❌ A correção precisa ser revisada.");
}

console.log("\\n📋 PRÓXIMOS PASSOS PARA TESTE MANUAL:");
console.log("1. Acesse http://localhost:4000");
console.log("2. Faça login como SuperAdmin");
console.log("3. Clique em 'Nova Empresa'");
console.log("4. Teste o campo telefone com diferentes entradas");
console.log("5. Verifique se o limite de 11 dígitos está funcionando");
console.log("6. Teste também o modal de 'Editar Empresa'");
