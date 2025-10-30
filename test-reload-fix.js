// Script para testar se o problema de reload infinito foi resolvido
// Execute este script no console do navegador para monitorar os logs

console.log("🔍 Monitorando logs para detectar reload infinito...");

let logCount = {};
const originalConsoleLog = console.log;

console.log = function (...args) {
  const message = args.join(" ");

  // Detectar mensagens que indicam loop infinito
  const loopIndicators = [
    "selectEnterprise chamado com",
    "Empresas são diferentes?",
    "Auto-sincronizando empresa",
    "Carregando empresas",
    "useEffect",
  ];

  const hasLoopIndicator = loopIndicators.some((indicator) =>
    message.includes(indicator)
  );

  if (hasLoopIndicator) {
    logCount[message] = (logCount[message] || 0) + 1;

    if (logCount[message] > 5) {
      console.error("🚨 POSSÍVEL LOOP INFINITO DETECTADO:", message);
      console.error("🔢 Contagem:", logCount[message]);
    }
  }

  originalConsoleLog.apply(console, args);
};

// Monitorar por 10 segundos
setTimeout(() => {
  console.log("📊 Relatório final de logs:");
  Object.entries(logCount).forEach(([message, count]) => {
    if (count > 3) {
      console.warn(`⚠️ ${message}: ${count}x (suspeito)`);
    } else {
      console.log(`✅ ${message}: ${count}x (normal)`);
    }
  });
}, 10000);
