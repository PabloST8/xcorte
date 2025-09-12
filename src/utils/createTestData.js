import { collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const createTestData = async (
  enterpriseEmail = "pablofafstar@gmail.com"
) => {
  try {
    console.log("Criando dados de teste para:", enterpriseEmail);

    // 1. Criar um cliente na subcoleção
    const clientData = {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 99999-9999",
      createdAt: new Date(),
      totalSpent: 2500, // em centavos
      enterpriseEmail: enterpriseEmail,
    };

    const clientsRef = collection(
      db,
      "enterprises",
      enterpriseEmail,
      "clients"
    );
    const clientDoc = await addDoc(clientsRef, clientData);
    console.log("Cliente criado com ID:", clientDoc.id);

    // 2. Criar um agendamento na subcoleção
    const bookingData = {
      clientId: clientDoc.id,
      clientName: "João Silva",
      clientEmail: "joao@example.com",
      clientPhone: "(11) 99999-9999",
      date: new Date(),
      startTime: "14:00",
      endTime: "15:00",
      serviceName: "Corte + Barba",
      price: 2500, // em centavos
      totalPrice: 2500,
      status: "CONFIRMADO",
      enterpriseEmail: enterpriseEmail,
      createdAt: new Date(),
    };

    const bookingsRef = collection(
      db,
      "enterprises",
      enterpriseEmail,
      "bookings"
    );
    const bookingDoc = await addDoc(bookingsRef, bookingData);
    console.log("Agendamento criado com ID:", bookingDoc.id);

    console.log("Dados de teste criados com sucesso!");
    return { clientId: clientDoc.id, bookingId: bookingDoc.id };
  } catch (error) {
    console.error("Erro ao criar dados de teste:", error);
    throw error;
  }
};
