import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

export const debugFirestoreData = async (
  enterpriseEmail = "pablofafstar@gmail.com"
) => {
  console.log("=== DEBUG FIRESTORE DATA ===");
  console.log("Enterprise Email:", enterpriseEmail);

  try {
    // 1. Verificar subcoleção de clientes
    console.log("\n1. Verificando subcoleção de clientes...");
    const clientsRef = collection(
      db,
      "enterprises",
      enterpriseEmail,
      "clients"
    );
    const clientsSnapshot = await getDocs(clientsRef);
    console.log(`Clientes na subcoleção: ${clientsSnapshot.docs.length}`);

    clientsSnapshot.docs.forEach((doc, index) => {
      console.log(`Cliente ${index + 1}:`, doc.id, doc.data());
    });

    // 2. Verificar subcoleção de agendamentos
    console.log("\n2. Verificando subcoleção de agendamentos...");
    const bookingsRef = collection(
      db,
      "enterprises",
      enterpriseEmail,
      "bookings"
    );
    const bookingsSnapshot = await getDocs(bookingsRef);
    console.log(`Agendamentos na subcoleção: ${bookingsSnapshot.docs.length}`);

    bookingsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Agendamento ${index + 1}:`, {
        id: doc.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: data.date,
        price: data.price || data.totalPrice,
      });
    });

    // 3. Verificar coleção global de clientes
    console.log("\n3. Verificando coleção global de clientes...");
    const globalClientsQuery = query(
      collection(db, "clients"),
      where("enterpriseEmail", "==", enterpriseEmail)
    );
    const globalClientsSnapshot = await getDocs(globalClientsQuery);
    console.log(
      `Clientes na coleção global: ${globalClientsSnapshot.docs.length}`
    );

    globalClientsSnapshot.docs.forEach((doc, index) => {
      console.log(`Cliente global ${index + 1}:`, doc.id, doc.data());
    });

    // 4. Verificar coleção global de agendamentos
    console.log("\n4. Verificando coleção global de agendamentos...");
    const globalBookingsQuery = query(
      collection(db, "bookings"),
      where("enterpriseEmail", "==", enterpriseEmail)
    );
    const globalBookingsSnapshot = await getDocs(globalBookingsQuery);
    console.log(
      `Agendamentos na coleção global: ${globalBookingsSnapshot.docs.length}`
    );

    globalBookingsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Agendamento global ${index + 1}:`, {
        id: doc.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: data.date,
        price: data.price || data.totalPrice,
      });
    });

    console.log("\n=== FIM DEBUG ===");
  } catch (error) {
    console.error("Erro no debug:", error);
  }
};
