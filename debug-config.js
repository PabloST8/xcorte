// Teste de configuração
console.log("=== TESTE DE CONFIGURAÇÃO ===");
console.log(
  "import.meta.env.VITE_USE_REMOTE_API:",
  import.meta.env.VITE_USE_REMOTE_API
);
console.log("import.meta.env:", import.meta.env);
console.log(
  "USE_REMOTE_API calculado:",
  (import.meta.env.VITE_USE_REMOTE_API || "false").toLowerCase() === "true"
);
console.log("===============================");
