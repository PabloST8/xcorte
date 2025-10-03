// Script para testar a função formatPaymentMethod
// Para executar no console do navegador

// Teste com dados simulados
const testAppointments = [
  // Agendamento antigo sem pagamento
  {
    id: "old-appointment",
    notes: "",
    paymentMethod: undefined,
    payment_method: undefined,
    clientName: "Cliente Antigo",
  },

  // Agendamento novo do BookingOverlay (pix)
  {
    id: "new-overlay-pix",
    notes: "pagamento: pix",
    paymentMethod: "pix",
    payment_method: undefined,
    clientName: "Cliente Overlay PIX",
  },

  // Agendamento novo do Cart (cartão)
  {
    id: "new-cart-card",
    notes: "Agendamento via carrinho | pagamento: card",
    paymentMethod: "card",
    payment_method: undefined,
    clientName: "Cliente Cart Card",
  },

  // Agendamento com dinheiro
  {
    id: "new-cash",
    notes: "pagamento: cash",
    paymentMethod: "cash",
    payment_method: undefined,
    clientName: "Cliente Dinheiro",
  },
];

// Função de teste (baseada na implementação atual)
function formatPaymentMethod(appointment) {
  console.log(`🔍 [Payment] Testing appointment: ${appointment.id}`, {
    notes: appointment.notes,
    paymentMethod: appointment.paymentMethod,
    payment_method: appointment.payment_method,
    clientName: appointment.clientName,
  });

  if (!appointment) {
    console.log("❌ [Payment] No appointment provided");
    return "Não informado";
  }

  // Estratégia 1: Regex no campo notes
  if (appointment.notes) {
    // Padrão 1: "pagamento: valor"
    const regex1 = /pagamento:\s*(pix|cartão|cartao|card|dinheiro|cash)/i;
    const match1 = appointment.notes.match(regex1);

    if (match1) {
      const method = match1[1].toLowerCase();
      const formatted =
        method === "card"
          ? "Cartão"
          : method === "cash"
          ? "Dinheiro"
          : method === "pix"
          ? "PIX"
          : method === "cartão" || method === "cartao"
          ? "Cartão"
          : method === "dinheiro"
          ? "Dinheiro"
          : method;
      console.log(`✅ [Payment] Found via notes regex: ${formatted}`);
      return formatted;
    }

    // Padrão 2: "pagamento valor" (sem dois pontos)
    const regex2 = /pagamento\s+(pix|cartão|cartao|card|dinheiro|cash)/i;
    const match2 = appointment.notes.match(regex2);

    if (match2) {
      const method = match2[1].toLowerCase();
      const formatted =
        method === "card"
          ? "Cartão"
          : method === "cash"
          ? "Dinheiro"
          : method === "pix"
          ? "PIX"
          : method === "cartão" || method === "cartao"
          ? "Cartão"
          : method === "dinheiro"
          ? "Dinheiro"
          : method;
      console.log(`✅ [Payment] Found via notes regex 2: ${formatted}`);
      return formatted;
    }
  }

  // Estratégia 2: Campo direto paymentMethod ou payment_method
  const directPayment = appointment.paymentMethod || appointment.payment_method;
  if (directPayment) {
    const method = directPayment.toLowerCase();
    const formatted =
      method === "card"
        ? "Cartão"
        : method === "cash"
        ? "Dinheiro"
        : method === "pix"
        ? "PIX"
        : method === "cartão" || method === "cartao"
        ? "Cartão"
        : method === "dinheiro"
        ? "Dinheiro"
        : directPayment;
    console.log(`✅ [Payment] Found via direct field: ${formatted}`);
    return formatted;
  }

  // Estratégia 3: Busca textual por palavras-chave
  if (appointment.notes) {
    const notesLower = appointment.notes.toLowerCase();
    if (notesLower.includes("pix")) {
      console.log("✅ [Payment] Found PIX via text search");
      return "PIX";
    }
    if (
      notesLower.includes("cartão") ||
      notesLower.includes("cartao") ||
      notesLower.includes("card")
    ) {
      console.log("✅ [Payment] Found Cartão via text search");
      return "Cartão";
    }
    if (notesLower.includes("dinheiro") || notesLower.includes("cash")) {
      console.log("✅ [Payment] Found Dinheiro via text search");
      return "Dinheiro";
    }
  }

  console.log("❌ [Payment] No payment method found");
  return "Não informado";
}

// Executar testes
console.log("🧪 Testing formatPaymentMethod function:");
testAppointments.forEach((appointment) => {
  console.log(`\n--- Testing ${appointment.id} ---`);
  const result = formatPaymentMethod(appointment);
  console.log(`Result: ${result}`);
});
