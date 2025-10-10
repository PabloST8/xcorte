// Teste do utilitário phoneUtils
import { formatPhone, validatePhone } from "./src/utils/phoneUtils.js";

console.log("🧪 TESTE DO UTILITÁRIO phoneUtils.js");
console.log("=".repeat(50));

// Teste formatPhone
console.log("\\n📱 Teste formatPhone:");
console.log("formatPhone('11999999999'):", formatPhone("11999999999"));
console.log("formatPhone('119999999999999'):", formatPhone("119999999999999"));

// Teste validatePhone
console.log("\\n✅ Teste validatePhone:");
console.log(
  "validatePhone('(11) 99999-9999'):",
  validatePhone("(11) 99999-9999")
);
console.log("validatePhone('11999999999'):", validatePhone("11999999999"));
console.log("validatePhone('1199999999'):", validatePhone("1199999999"));
console.log("validatePhone('119999'):", validatePhone("119999"));
