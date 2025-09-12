// Script para limpar cache e cookies
console.log(
  "Para limpar o cache da empresa no navegador, execute no DevTools:"
);
console.log("");
console.log(
  'document.cookie = "current_enterprise=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";'
);
console.log("localStorage.clear();");
console.log("location.reload();");
console.log("");
console.log(
  "Ou simplesmente abra uma aba anônima/incógnito para testar sem cache."
);
