export function mapFirebaseError(e) {
  const code = e.code || "";
  if (code.includes("invalid-credential")) return "Credenciais inválidas";
  if (code.includes("user-not-found")) return "Usuário não encontrado";
  if (code.includes("email-already-in-use")) return "Telefone/e-mail já em uso";
  if (code.includes("too-many-requests"))
    return "Muitas tentativas. Tente mais tarde.";
  return e.message || "Erro de autenticação";
}
