// Utilitário para sincronizar empresas de teste no Firestore
import { db } from "../services/firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

const testEnterprises = [
  {
    id: "pablofafstar@gmail.com",
    name: "Barbearia do Pablo",
    email: "pablofafstar@gmail.com",
    phone: "(11) 99999-2222",
    address: "Rua Augusta, 1234 - Consolação, São Paulo - SP",
    description: "Barbearia do Pablo",
    displayName: "Barbearia do Pablo",
    photoURL: "",
    active: true,
    blocked: false,
    isActive: true,
    isBlocked: false,
  },
  {
    id: "empresaadmin@xcortes.com",
    name: "XCorte Admin",
    email: "empresaadmin@xcortes.com",
    phone: "(11) 99999-1111",
    address: "Av. Paulista, 567 - Bela Vista, São Paulo - SP",
    description: "Empresa Admin XCortes",
    displayName: "XCorte Admin",
    photoURL: "",
    active: true,
    blocked: false,
    isActive: true,
    isBlocked: false,
  },
];

export const syncTestEnterprisesToFirestore = async () => {
  console.log("🔄 Sincronizando empresas de teste para Firestore...");

  for (const enterprise of testEnterprises) {
    try {
      // Verificar se já existe
      const enterpriseRef = doc(db, "enterprises", enterprise.email);
      const existingDoc = await getDoc(enterpriseRef);

      if (!existingDoc.exists()) {
        console.log(`📝 Criando empresa de teste: ${enterprise.email}`);

        const enterpriseData = {
          ...enterprise,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          settings: {
            workingHours: {
              start: "08:00",
              end: "18:00",
              days: [1, 2, 3, 4, 5, 6], // Segunda a sábado
            },
            appointmentDuration: 30, // 30 minutos padrão
            allowOnlineBooking: true,
          },
        };

        await setDoc(enterpriseRef, enterpriseData);
        console.log(`✅ Empresa de teste criada: ${enterprise.name}`);
      } else {
        console.log(`ℹ️ Empresa já existe: ${enterprise.email}`);
      }
    } catch (error) {
      console.error(
        `❌ Erro ao sincronizar empresa ${enterprise.email}:`,
        error
      );
    }
  }

  console.log("🎉 Sincronização de empresas de teste concluída!");
};
