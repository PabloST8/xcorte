import {
  collection,
  query,
  getDocs,
  limit,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const firestoreAppointmentsService = {
  // Buscar agendamentos por filtros
  async getAppointments(filters = {}) {
    try {
      let appointments = [];

      // Se temos o email da empresa, buscar na subcoleção da empresa
      if (filters.enterpriseEmail) {
        // Caminho: enterprises/{enterpriseEmail}/bookings
        const enterpriseBookingsRef = collection(
          db,
          "enterprises",
          filters.enterpriseEmail,
          "bookings"
        );

        // Query simples na subcoleção
        let appointmentsQuery = query(enterpriseBookingsRef, limit(100));

        const snapshot = await getDocs(appointmentsQuery);

        snapshot.forEach((doc) => {
          const data = doc.data();

          // Mapear os dados do Firestore para o formato esperado pela aplicação
          appointments.push({
            id: doc.id,
            // Dados do cliente
            clientName: data.clientName || "N/A",
            clientPhone: data.clientPhone || "N/A",
            clientEmail: data.clientEmail || "", // Pode estar vazio mesmo

            // Dados do agendamento
            date: data.date || "", // "2025-09-15"
            startTime: data.startTime || data.endTime || "", // usar startTime se disponível, senão endTime
            endTime: data.endTime || "",

            // Dados do serviço/produto
            productName: data.productName || "Serviço",
            productPrice: data.productPrice || 0,
            productDuration: data.productDuration || 30,

            // Dados do funcionário
            staffName: data.staffName || "Funcionário",
            employeeId: data.employeeId || "",

            // Dados da empresa
            enterpriseEmail: data.enterpriseEmail || filters.enterpriseEmail,

            // Metadados
            createdAt: data.createdAt || "",
            notes: data.notes || "",
            status: data.status || "agendado",

            // Campos adicionais que podem existir
            ...data,
          });
        });
      } else {
        // Fallback: buscar na coleção raiz se não temos email da empresa
        const appointmentsQuery = query(collection(db, "bookings"), limit(100));
        const snapshot = await getDocs(appointmentsQuery);

        snapshot.forEach((doc) => {
          const data = doc.data();
          appointments.push({
            id: doc.id,
            ...data,
          });
        });
      }

      // Aplicar filtros no frontend
      let filteredAppointments = this.applyFilters(appointments, filters);

      return {
        success: true,
        data: filteredAppointments,
      };
    } catch (error) {
      console.error("Erro ao buscar agendamentos do Firestore:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Função auxiliar para aplicar filtros no frontend
  applyFilters(appointments, filters) {
    let filteredAppointments = appointments;

    // Filtro por data no frontend
    if (filters.date && filters.date !== "all") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      filteredAppointments = filteredAppointments.filter((appointment) => {
        const appointmentDate = appointment.date;
        if (!appointmentDate) return false;

        switch (filters.date) {
          case "today":
            return appointmentDate === todayStr;
          case "tomorrow": {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];
            return appointmentDate === tomorrowStr;
          }
          case "week": {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            const weekStr = weekFromNow.toISOString().split("T")[0];
            return appointmentDate >= todayStr && appointmentDate <= weekStr;
          }
          case "month": {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            const endOfMonth = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              0
            );
            const startStr = startOfMonth.toISOString().split("T")[0];
            const endStr = endOfMonth.toISOString().split("T")[0];
            return appointmentDate >= startStr && appointmentDate <= endStr;
          }
          default:
            return true;
        }
      });
    }

    // Filtro por status no frontend
    if (filters.status) {
      filteredAppointments = filteredAppointments.filter(
        (appointment) => appointment.status === filters.status
      );
    }

    // Filtro por busca no frontend
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredAppointments = filteredAppointments.filter(
        (appointment) =>
          (appointment.clientName || "").toLowerCase().includes(searchTerm) ||
          (appointment.clientPhone || "").toLowerCase().includes(searchTerm) ||
          (appointment.clientEmail || "").toLowerCase().includes(searchTerm) ||
          (appointment.productName || "").toLowerCase().includes(searchTerm) ||
          (appointment.serviceName || "").toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar no frontend
    filteredAppointments.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.startTime || "").localeCompare(a.startTime || "");
    });

    return filteredAppointments;
  },

  // Deletar agendamento
  async deleteAppointment(appointmentId, enterpriseEmail = null) {
    try {
      let appointmentRef;

      if (enterpriseEmail) {
        // Deletar da subcoleção da empresa
        appointmentRef = doc(
          db,
          "enterprises",
          enterpriseEmail,
          "bookings",
          appointmentId
        );
      } else {
        // Deletar da coleção raiz
        appointmentRef = doc(db, "bookings", appointmentId);
      }

      await deleteDoc(appointmentRef);

      return {
        success: true,
        message: "Agendamento deletado com sucesso",
      };
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
