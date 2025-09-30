// Debug dos agendamentos para funcionário específico
console.log("🔍 INICIANDO DEBUG DOS AGENDAMENTOS");

// Simular busca de agendamentos para hoje (30/09/2025)
const debugDate = "2025-09-30";
const selectedEmployeeId = "exemplo1@gmail.com"; // aline santos

// Função para verificar agendamentos
async function debugBookingConflicts() {
  try {
    const { bookingApiService } = window;

    if (!bookingApiService) {
      console.error("❌ bookingApiService não encontrado");
      return;
    }

    console.log("📅 Buscando agendamentos para:", {
      date: debugDate,
      employeeId: selectedEmployeeId,
      employeeName: "aline santos",
    });

    // Buscar todos os agendamentos do dia
    const result = await bookingApiService.getBookings(
      "pablofelipe8743@gmail.com",
      debugDate
    );

    if (!result.success) {
      console.error("❌ Erro ao buscar agendamentos:", result.error);
      return;
    }

    const allBookings = result.data || [];
    console.log("📊 TODOS os agendamentos do dia:", allBookings);

    // Filtrar agendamentos do funcionário
    const employeeBookings = allBookings.filter((booking) => {
      // Estratégias de identificação
      const byId = booking.employeeId === selectedEmployeeId;
      const byName =
        booking.employeeName &&
        booking.employeeName.toLowerCase().includes("aline");
      const byStaffName =
        booking.staffName && booking.staffName.toLowerCase().includes("aline");

      console.log(`🔍 Agendamento ${booking.id}:`, {
        employeeId: booking.employeeId,
        employeeName: booking.employeeName,
        staffName: booking.staffName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        productName: booking.productName,
        status: booking.status,
        byId,
        byName,
        byStaffName,
        matches: byId || byName || byStaffName,
      });

      return byId || byName || byStaffName;
    });

    console.log(
      "🎯 Agendamentos filtrados para o funcionário:",
      employeeBookings
    );

    // Verificar especificamente o horário 16:30
    const conflictAt1630 = employeeBookings.find((booking) => {
      const startTime = booking.startTime;
      return startTime === "16:30";
    });

    console.log("⏰ Conflito às 16:30?", conflictAt1630);

    return {
      allBookings,
      employeeBookings,
      conflictAt1630,
    };
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

// Executar debug
debugBookingConflicts().then((result) => {
  console.log("✅ Debug concluído:", result);
});
