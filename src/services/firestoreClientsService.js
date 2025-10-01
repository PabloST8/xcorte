import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const firestoreClientsService = {
  // Função auxiliar para buscar foto do usuário (reutilizada do firestoreAppointmentsService)
  async getUserPhoto(clientEmail, clientPhone) {
    if (!clientEmail && !clientPhone) return null;

    try {
      // Primeiro tentar buscar por email (mais confiável)
      if (clientEmail && clientEmail !== "N/A" && clientEmail !== "") {
        const userDoc = await getDoc(doc(db, "users", clientEmail));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return userData.photoURL || null;
        }
      }

      // Se não encontrou por email, tentar buscar por telefone
      if (clientPhone && clientPhone !== "N/A" && clientPhone !== "") {
        const usersRef = collection(db, "users");
        const phoneQuery = query(usersRef, where("phone", "==", clientPhone));
        const phoneSnapshot = await getDocs(phoneQuery);

        if (!phoneSnapshot.empty) {
          const userData = phoneSnapshot.docs[0].data();
          return userData.photoURL || null;
        }
      }

      return null;
    } catch (error) {
      console.warn("Erro ao buscar foto do cliente:", error);
      return null;
    }
  },

  // Buscar clientes por filtros
  async getClients(filters = {}) {
    try {
      let clients = [];

      // Estratégia 1: Buscar clientes da subcoleção da empresa
      if (filters.enterpriseEmail) {
        try {
          const enterpriseClientsRef = collection(
            db,
            "enterprises",
            filters.enterpriseEmail,
            "clients"
          );
          const clientsQuery = query(enterpriseClientsRef, limit(100));
          const snapshot = await getDocs(clientsQuery);

          // Processar clientes e buscar suas fotos
          const clientPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const mappedData = this.mapClientData(data);

            // Buscar foto se ainda não tiver
            if (!mappedData.photoURL) {
              mappedData.photoURL = await this.getUserPhoto(
                mappedData.email,
                mappedData.phone
              );
            }

            return {
              id: doc.id,
              ...mappedData,
            };
          });

          clients = await Promise.all(clientPromises);

          // Se encontrou clientes na subcoleção, usar esses dados
          if (clients.length > 0) {
            console.log(
              `📸 Clientes da subcoleção processados com fotos:`,
              clients.slice(0, 2)
            );
            return this.processClients(clients, filters);
          }
        } catch (error) {
          console.log(
            "Subcoleção de clientes não encontrada, tentando estratégia alternativa"
          );
        }
      }

      // Estratégia 2: Buscar clientes únicos dos agendamentos
      if (filters.enterpriseEmail && clients.length === 0) {
        try {
          const bookingsRef = collection(
            db,
            "enterprises",
            filters.enterpriseEmail,
            "bookings"
          );
          const bookingsQuery = query(bookingsRef, limit(200));
          const bookingsSnapshot = await getDocs(bookingsQuery);

          // Extrair clientes únicos dos agendamentos
          const uniqueClients = new Map();

          // Primeiro, processar agendamentos para extrair clientes únicos
          bookingsSnapshot.forEach((doc) => {
            const booking = doc.data();
            const clientKey =
              booking.clientEmail || booking.clientPhone || booking.clientName;

            if (clientKey && !uniqueClients.has(clientKey)) {
              uniqueClients.set(clientKey, {
                id: clientKey.replace(/[^a-zA-Z0-9]/g, ""), // ID baseado no identificador
                name: booking.clientName || "N/A",
                phone: booking.clientPhone || "N/A",
                email: booking.clientEmail || "",
                appointmentsCount: 1,
                totalSpent: booking.productPrice || 0,
                lastAppointment: booking.date || "N/A",
                status: "Ativo",
                createdAt: booking.createdAt || "",
                enterpriseEmail: filters.enterpriseEmail,
              });
            } else if (clientKey && uniqueClients.has(clientKey)) {
              // Atualizar estatísticas do cliente existente
              const existing = uniqueClients.get(clientKey);
              existing.appointmentsCount += 1;
              existing.totalSpent += booking.productPrice || 0;
              if (booking.date > existing.lastAppointment) {
                existing.lastAppointment = booking.date;
              }
            }
          });

          // Agora buscar fotos para cada cliente único
          const clientsWithPhotos = await Promise.all(
            Array.from(uniqueClients.values()).map(async (client) => {
              const photoURL = await this.getUserPhoto(
                client.email,
                client.phone
              );
              return {
                ...client,
                photoURL: photoURL, // 📸 FOTO DO CLIENTE
              };
            })
          );

          clients = clientsWithPhotos;
          console.log(
            `📸 Clientes processados com fotos:`,
            clients.slice(0, 2)
          ); // Log dos primeiros 2 para debug
        } catch (error) {
          console.log("Erro ao buscar clientes dos agendamentos:", error);
        }
      }

      // Estratégia 3: Fallback para coleção global de usuários
      if (clients.length === 0) {
        try {
          const usersQuery = query(collection(db, "users"), limit(50));
          const snapshot = await getDocs(usersQuery);

          snapshot.forEach((doc) => {
            const data = doc.data();

            // Mapear os dados do Firestore para o formato esperado pela aplicação
            clients.push({
              id: doc.id,
              name: data.name || data.displayName || "N/A",
              phone: data.phone || data.phoneNumber || "N/A",
              email: data.email || "N/A",

              // Calcular estatísticas dos agendamentos (placeholder - idealmente seria calculado)
              appointmentsCount: data.appointmentsCount || 0,
              totalSpent: data.totalSpent || 0,
              lastAppointment: data.lastAppointment || "Nunca",
              status: data.status || "Ativo",

              // Campos adicionais
              createdAt: data.createdAt || "",
              updatedAt: data.updatedAt || "",

              // Manter dados originais
              ...data,
            });
          });
        } catch (error) {
          console.log("Erro ao buscar da coleção users:", error);
        }
      }

      // Processar e filtrar clientes
      return this.processClients(clients, filters);
    } catch (error) {
      console.error("Erro ao buscar clientes do Firestore:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Função auxiliar para mapear dados do cliente
  mapClientData(data) {
    return {
      name: data.name || data.displayName || "N/A",
      phone: data.phone || data.phoneNumber || "N/A",
      email: data.email || "N/A",
      photoURL: data.photoURL || null, // 📸 FOTO DO CLIENTE
      appointmentsCount: data.appointmentsCount || 0,
      totalSpent: data.totalSpent || 0,
      lastAppointment: data.lastAppointment || "Nunca",
      status: data.status || "Ativo",
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || "",
      ...data,
    };
  },

  // Função auxiliar para processar e filtrar clientes
  processClients(clients, filters) {
    let filteredClients = clients;

    // Filtrar por termo de busca no frontend
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredClients = clients.filter(
        (client) =>
          (client.name || "").toLowerCase().includes(searchTerm) ||
          (client.phone || "").toLowerCase().includes(searchTerm) ||
          (client.email || "").toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar no frontend se necessário
    if (filters.sortBy) {
      filteredClients.sort((a, b) => {
        switch (filters.sortBy) {
          case "name":
            return (a.name || "").localeCompare(b.name || "");
          case "created_at":
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          case "total_spent":
            return (b.totalSpent || 0) - (a.totalSpent || 0);
          case "last_appointment":
            return (b.lastAppointment || "").localeCompare(
              a.lastAppointment || ""
            );
          default:
            return 0;
        }
      });
    }

    return {
      success: true,
      data: filteredClients,
    };
  },

  // Buscar estatísticas de um cliente específico
  async getClientStats(clientEmail) {
    try {
      const bookingsRef = collection(db, "bookings");
      const clientBookingsQuery = query(
        bookingsRef,
        where("clientEmail", "==", clientEmail)
      );

      const snapshot = await getDocs(clientBookingsQuery);
      let totalSpent = 0;
      let appointmentsCount = 0;
      let lastAppointment = null;

      snapshot.forEach((doc) => {
        const booking = doc.data();
        appointmentsCount += 1;
        totalSpent += booking.productPrice || 0;

        if (!lastAppointment || booking.date > lastAppointment) {
          lastAppointment = booking.date;
        }
      });

      return {
        success: true,
        data: {
          appointmentsCount,
          totalSpent,
          lastAppointment: lastAppointment || "Nunca",
        },
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas do cliente:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
