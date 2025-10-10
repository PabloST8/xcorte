export function mapFirebaseError(e) {
  const code = e.code || "";

  // Mapeamento específico para erros de autenticação
  if (code.includes("invalid-credential") || code.includes("invalid-email")) {
    return "Usuário ou senha inválidos";
  }
  if (code.includes("user-not-found")) {
    return "Usuário ou senha inválidos"; // Unificar mensagem para não expor se usuário existe
  }
  if (code.includes("wrong-password")) {
    return "Usuário ou senha inválidos"; // Unificar mensagem para não expor se usuário existe
  }
  if (code.includes("invalid-login-credentials")) {
    return "Usuário ou senha inválidos";
  }
  if (code.includes("email-already-in-use")) {
    return "E-mail já está em uso";
  }
  if (code.includes("too-many-requests")) {
    return "Muitas tentativas de login. Tente novamente mais tarde.";
  }
  if (code.includes("user-disabled")) {
    return "Esta conta foi desativada";
  }
  if (code.includes("weak-password")) {
    return "A senha deve ter pelo menos 6 caracteres";
  }

  // Fallback para erros genéricos
  return "Usuário ou senha inválidos";
}
