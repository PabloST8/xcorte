// Gera credenciais sintéticas (email e senha) a partir de um telefone para compatibilidade
// com backend legado que exige email/senha.
// Formato de email: <digits>@phone.local
// Senha: P<digitsReverso>! (garante >= 6 chars assumindo telefone >= 6 dígitos)

export function buildSyntheticCredentials(phoneRaw) {
  const digits = (phoneRaw || "").replace(/\D/g, "");
  if (!digits) return { email: null, password: null };
  const email = `${digits}@phone.local`;
  const reversed = digits.split("").reverse().join("");
  const password = `P${reversed}!`;
  return { email, password };
}

export function isSyntheticEmail(email) {
  return /@phone\.local$/i.test(email || "");
}
