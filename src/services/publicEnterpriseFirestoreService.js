// Leitura pública (lado cliente) de dados da empresa no Firestore
// Estrutura: enterprises/{email} com subcoleções: products, employees, bookings
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

// Cache simples para evitar múltiplas requisições
const cache = {
  enterprises: null,
  timestamp: 0,
  TTL: 30000, // Reduzido para 30 segundos para debug
};

// Fallback para localStorage quando Firestore não está disponível
function getEnterprisesFromLocalStorage() {
  try {
    const stored = localStorage.getItem('xcorte_enterprises');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📦 Empresas carregadas do localStorage:", parsed.length);
      return parsed;
    }
  } catch (error) {
    console.warn("Erro ao carregar empresas do localStorage:", error);
  }
  
  // Dados de exemplo para desenvolvimento
  const defaultEnterprises = [
    {
      id: "pablofafstar@gmail.com",
      email: "pablofafstar@gmail.com", 
      name: "Barbearia do Pablo",
      displayName: "Barbearia do Pablo"
    }
  ];
  
  // Salvar dados de exemplo no localStorage
  try {
    localStorage.setItem('xcorte_enterprises', JSON.stringify(defaultEnterprises));
  } catch (e) {
    console.warn("Erro ao salvar empresas no localStorage:", e);
  }
  
  return defaultEnterprises;
}

export const publicEnterpriseFirestoreService = {
  async getEnterprises() {
    // Verifica cache primeiro (mas permite bypass)
    const now = Date.now();
    if (cache.enterprises && now - cache.timestamp < cache.TTL) {
      console.log("📄 Usando cache de empresas");
      return cache.enterprises;
    }

    // Tentar Firestore primeiro, localStorage como fallback
    try {
      console.log("🔍 Buscando empresas no Firestore...");
      const snap = await getDocs(collection(db, "enterprises"));
      console.log("📊 Documentos encontrados:", snap.docs.length);

      const enterprises = snap.docs.map((d) => {
        const data = d.data() || {};
        const email = data.email || d.id; // usar id como email se não estiver salvo no doc
        const name = data.name || data.displayName || email;
        console.log("📄 Documento processado:", { id: d.id, name, email });
        return { id: d.id, email, name, ...data };
      });

      // Atualiza cache
      cache.enterprises = enterprises;
      cache.timestamp = now;

      console.log("✅ Total de empresas processadas:", enterprises.length);
      return enterprises;
    } catch (e) {
      console.warn("❌ Falha ao listar enterprises no Firestore público, usando localStorage:", e);
      
      // Usar localStorage como fallback
      const localEnterprises = getEnterprisesFromLocalStorage();
      cache.enterprises = localEnterprises;
      cache.timestamp = now;
      
      return localEnterprises;
    }
  },
  async getServices(email) {
    if (!email) return [];
    try {
      const snap = await getDocs(
        collection(db, "enterprises", email, "products")
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("❌ Falha getServices Firestore, usando localStorage:", e);
      
      // Fallback para localStorage com dados de exemplo
      const defaultServices = [
        {
          id: "corte",
          name: "Corte de Cabelo",
          price: 2500, // R$ 25,00 em centavos
          duration: 30,
          description: "Corte moderno e estiloso"
        },
        {
          id: "barba",
          name: "Barba",
          price: 1500, // R$ 15,00 em centavos
          duration: 20,
          description: "Aparar e fazer a barba"
        }
      ];
      
      try {
        const stored = localStorage.getItem(`xcorte_services_${email}`);
        if (stored) {
          return JSON.parse(stored);
        } else {
          localStorage.setItem(`xcorte_services_${email}`, JSON.stringify(defaultServices));
          return defaultServices;
        }
      } catch (storageError) {
        console.warn("Erro no localStorage para serviços:", storageError);
        return defaultServices;
      }
    }
  },
  async getStaff(email) {
    if (!email) return [];
    try {
      // Primeiro tenta coleção raiz
      const snap = await getDocs(collection(db, "employees"));
      const root = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((emp) => emp.enterpriseEmail === email);
      if (root.length) return root;
    } catch (e) {
      console.warn("❌ Falha getStaff raiz:", e);
    }
    // Fallback: subcoleção por empresa (enterprises/{email}/employees)
    try {
      const sub = await getDocs(
        collection(db, "enterprises", email, "employees")
      );
      return sub.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("❌ Falha getStaff subcoleção, usando localStorage:", e);
      
      // Fallback para localStorage com dados de exemplo
      const defaultStaff = [
        {
          id: "staff1",
          name: "Pablo",
          role: "Barbeiro Principal",
          email: "pablo@example.com",
          enterpriseEmail: email
        }
      ];
      
      try {
        const stored = localStorage.getItem(`xcorte_staff_${email}`);
        if (stored) {
          return JSON.parse(stored);
        } else {
          localStorage.setItem(`xcorte_staff_${email}`, JSON.stringify(defaultStaff));
          return defaultStaff;
        }
      } catch (storageError) {
        console.warn("Erro no localStorage para funcionários:", storageError);
        return defaultStaff;
      }
    }
  },
  async getUpcomingBookings(email, limit = 5) {
    if (!email) return [];
    try {
      const snap = await getDocs(
        collection(db, "enterprises", email, "bookings")
      );
      const todayStr = new Date().toISOString().split("T")[0];
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((b) => b.date >= todayStr)
        .sort((a, b) =>
          (a.date + a.startTime).localeCompare(b.date + b.startTime)
        )
        .slice(0, limit);
    } catch (e) {
      console.warn("❌ Falha getUpcomingBookings Firestore, usando localStorage:", e);
      
      // Usar dados do localStorage de agendamentos
      try {
        const stored = localStorage.getItem(`xcorte_bookings_${email}`);
        if (stored) {
          const bookings = JSON.parse(stored);
          const todayStr = new Date().toISOString().split("T")[0];
          return bookings
            .filter((b) => b.date >= todayStr)
            .sort((a, b) =>
              (a.date + a.startTime).localeCompare(b.date + b.startTime)
            )
            .slice(0, limit);
        }
      } catch (storageError) {
        console.warn("Erro no localStorage para agendamentos próximos:", storageError);
      }
      
      return [];
    }
  },
};
