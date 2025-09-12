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

export const publicEnterpriseFirestoreService = {
  async getEnterprises() {
    // Verifica cache primeiro (mas permite bypass)
    const now = Date.now();
    if (cache.enterprises && now - cache.timestamp < cache.TTL) {
      console.log("📄 Usando cache de empresas");
      return cache.enterprises;
    }

    // Lista documentos da coleção raiz 'enterprises'
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
      console.warn("❌ Falha ao listar enterprises no Firestore público", e);
      // Retorna cache se disponível, mesmo expirado
      return cache.enterprises || [];
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
      console.warn("Falha getServices Firestore:", e);
      return [];
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
      console.warn("Falha getStaff raiz:", e);
    }
    // Fallback: subcoleção por empresa (enterprises/{email}/employees)
    try {
      const sub = await getDocs(
        collection(db, "enterprises", email, "employees")
      );
      return sub.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Falha getStaff subcoleção:", e);
      return [];
    }
  },
  async getUpcomingBookings(email, limit = 5) {
    if (!email) return [];
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
  },
};
