import { useQuery } from "@tanstack/react-query";
import { firestoreAppointmentsService } from "../services/firestoreAppointmentsService";
import { firestoreClientsService } from "../services/firestoreClientsService";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { formatDateBR } from "../utils/dateUtils";

export const useEnterpriseClients = () => {
  const { currentEnterprise } = useEnterprise();
  const enterpriseEmail = currentEnterprise?.email;

  return useQuery({
    queryKey: ["enterprise-clients", enterpriseEmail],
    enabled: !!enterpriseEmail,
    queryFn: async () => {
      console.log("🔍 Buscando clientes para empresa:", enterpriseEmail);

      // 1. Buscar todos os agendamentos da empresa
      const appointmentsResp =
        await firestoreAppointmentsService.getAppointments({ enterpriseEmail });
      if (!appointmentsResp.success || !appointmentsResp.data) {
        console.log(
          "❌ Erro ao buscar agendamentos ou nenhum agendamento encontrado"
        );
        return [];
      }
      const appointments = appointmentsResp.data;
      console.log("📅 Agendamentos encontrados:", appointments.length);

      // 2. Se houver clientId, buscar clientes normalmente
      const clientIds = [
        ...new Set(appointments.map((a) => a.clientId).filter(Boolean)),
      ];

      let clients = [];

      if (clientIds.length > 0) {
        console.log("👥 Clientes com ID encontrados:", clientIds.length);
        const clientsResp = await firestoreClientsService.getClients({
          ids: clientIds,
        });
        if (clientsResp.success && clientsResp.data) {
          clients = clientsResp.data;
        }
      } else {
        console.log("📱 Agrupando clientes por telefone/nome");
        // 3. Se não houver clientId, agrupar clientes por telefone/nome dos agendamentos
        const clientsByPhone = {};
        appointments.forEach((a) => {
          const phone = a.clientPhone || a.phone || a.telefone;
          const name = a.clientName || a.name || a.nome;
          if (phone) {
            if (!clientsByPhone[phone]) {
              clientsByPhone[phone] = {
                id: phone, // usar telefone como ID temporário
                name: name || phone,
                phone,
                email: a.clientEmail || a.email || "",
              };
            }
          }
        });
        clients = Object.values(clientsByPhone);
      }

      // 4. Calcular estatísticas para cada cliente
      const clientsWithStats = clients.map((client) => {
        // Filtrar agendamentos deste cliente
        const clientAppointments = appointments.filter((a) => {
          // Se temos ID de cliente, usar isso
          if (client.id && a.clientId) {
            return a.clientId === client.id;
          }
          // Senão, usar telefone
          const appointmentPhone = a.clientPhone || a.phone || a.telefone;
          return appointmentPhone === client.phone;
        });

        console.log(
          `📊 Cliente ${client.name}: ${clientAppointments.length} agendamentos`
        );

        // Calcular total gasto
        const totalSpent = clientAppointments.reduce((total, appointment) => {
          // Tentar diferentes campos onde o preço pode estar
          const price =
            appointment.totalPrice ||
            appointment.productPrice ||
            appointment.price ||
            appointment.valor ||
            0;

          console.log(`💰 Agendamento ${appointment.id}:`, {
            totalPrice: appointment.totalPrice,
            productPrice: appointment.productPrice,
            price: appointment.price,
            valor: appointment.valor,
            priceUsed: price,
          });

          return total + price;
        }, 0);

        console.log(`💰 Total calculado para ${client.name}:`, totalSpent);

        // Encontrar último agendamento
        const sortedAppointments = clientAppointments
          .filter((a) => a.date || a.appointmentDate)
          .sort((a, b) => {
            const dateA = new Date(a.date || a.appointmentDate);
            const dateB = new Date(b.date || b.appointmentDate);
            return dateB - dateA;
          });

        const lastAppointment = sortedAppointments[0]
          ? formatDateBR(
              sortedAppointments[0].date ||
                sortedAppointments[0].appointmentDate
            )
          : "Nunca";

        return {
          ...client,
          appointmentsCount: clientAppointments.length,
          totalSpent: totalSpent,
          lastAppointment: lastAppointment,
        };
      });

      console.log("✅ Clientes processados:", clientsWithStats.length);
      return clientsWithStats;
    },
    staleTime: 5 * 60 * 1000,
  });
};
