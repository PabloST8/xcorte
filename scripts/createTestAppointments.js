import { doc, setDoc } from "firebase/firestore";
import { db } from "../src/services/firebase.js";

// Agendamentos de teste para diferentes status
const testAppointments = [
  {
    id: "test-001",
    enterpriseEmail: "pablofelipe8743@gmail.com",
    clientName: "João Silva",
    clientPhone: "(11) 99999-1111",
    clientEmail: "joao@teste.com",
    productId: "1",
    productName: "Corte Masculino",
    productDuration: 30,
    productPrice: 2500,
    date: "2025-10-10", // hoje
    startTime: "09:00",
    endTime: "09:30",
    status: "agendado",
    staffName: "Funcionário Teste",
    employeeId: "emp001",
    notes: "Agendamento de teste - status agendado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "test-002",
    enterpriseEmail: "pablofelipe8743@gmail.com",
    clientName: "Maria Santos",
    clientPhone: "(11) 99999-2222",
    clientEmail: "maria@teste.com",
    productId: "2",
    productName: "Corte Feminino",
    productDuration: 60,
    productPrice: 4000,
    date: "2025-10-10", // hoje
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmado",
    staffName: "Funcionário Teste",
    employeeId: "emp001",
    notes: "Agendamento de teste - status confirmado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "test-003",
    enterpriseEmail: "pablofelipe8743@gmail.com",
    clientName: "Pedro Costa",
    clientPhone: "(11) 99999-3333",
    clientEmail: "pedro@teste.com",
    productId: "3",
    productName: "Barba",
    productDuration: 20,
    productPrice: 1500,
    date: "2025-10-11", // amanhã
    startTime: "14:00",
    endTime: "14:20",
    status: "agendado",
    staffName: "Funcionário Teste",
    employeeId: "emp001",
    notes: "Agendamento de teste - para amanhã",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "test-004",
    enterpriseEmail: "pablofelipe8743@gmail.com",
    clientName: "Ana Oliveira",
    clientPhone: "(11) 99999-4444",
    clientEmail: "ana@teste.com",
    productId: "4",
    productName: "Escova",
    productDuration: 45,
    productPrice: 3000,
    date: "2025-10-09", // ontem
    startTime: "16:00",
    endTime: "16:45",
    status: "concluido",
    staffName: "Funcionário Teste",
    employeeId: "emp001",
    notes: "Agendamento de teste - concluído",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "test-005",
    enterpriseEmail: "pablofelipe8743@gmail.com",
    clientName: "Carlos Ferreira",
    clientPhone: "(11) 99999-5555",
    clientEmail: "carlos@teste.com",
    productId: "1",
    productName: "Corte Masculino",
    productDuration: 30,
    productPrice: 2500,
    date: "2025-10-08", // anteontem
    startTime: "11:00",
    endTime: "11:30",
    status: "cancelado",
    staffName: "Funcionário Teste",
    employeeId: "emp001",
    notes: "Agendamento de teste - cancelado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function createTestAppointments() {
  try {
    console.log("🔥 Criando agendamentos de teste...");

    const enterpriseEmail = "pablofelipe8743@gmail.com";

    for (const appointment of testAppointments) {
      try {
        // Criar na subcoleção da empresa
        const appointmentRef = doc(
          db,
          "enterprises",
          enterpriseEmail,
          "bookings",
          appointment.id
        );

        await setDoc(appointmentRef, appointment);

        console.log(
          `✅ Agendamento criado: ${appointment.clientName} - ${appointment.status}`
        );
      } catch (error) {
        console.error(`❌ Erro ao criar agendamento ${appointment.id}:`, error);
      }
    }

    console.log("🎉 Agendamentos de teste criados com sucesso!");
    console.log("📊 Resumo dos agendamentos:");
    testAppointments.forEach((apt) => {
      console.log(`  - ${apt.clientName}: ${apt.status} (${apt.date})`);
    });
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar função principal
createTestAppointments();

export { createTestAppointments, testAppointments };
