import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export const firestoreEnterpriseService = {
  // Criar nova empresa
  async createEnterprise(enterpriseData) {
    try {
      console.log("🏢 Criando nova empresa:", enterpriseData);

      // Validar dados obrigatórios
      if (!enterpriseData.email) {
        throw new Error("Email é obrigatório");
      }
      if (!enterpriseData.name) {
        throw new Error("Nome da empresa é obrigatório");
      }

      // Verificar se a empresa já existe
      console.log("🔍 Verificando se email já existe:", enterpriseData.email);
      const existingEnterprise = await this.getEnterpriseByEmail(
        enterpriseData.email
      );
      console.log("🔍 Empresa encontrada:", existingEnterprise);

      if (existingEnterprise) {
        console.log("❌ Email duplicado encontrado! Rejeitando criação.");
        throw new Error("Já existe uma empresa com este email");
      }

      console.log("✅ Email disponível, prosseguindo com criação.");

      // Preparar dados da empresa
      const now = Timestamp.now();
      const enterpriseDoc = {
        id: enterpriseData.email, // Usar email como ID
        name: enterpriseData.name,
        displayName: enterpriseData.displayName || enterpriseData.name,
        email: enterpriseData.email,
        phone: enterpriseData.phone || "",
        address: enterpriseData.address || "",
        photoURL: "", // Será preenchido depois se houver upload de foto
        active: true,
        blocked: false,
        createdAt: now,
        updatedAt: now,
        // Dados padrão para funcionamento do sistema
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

      // Salvar no Firestore usando o email como ID do documento
      const enterpriseRef = doc(db, "enterprises", enterpriseData.email);
      await setDoc(enterpriseRef, enterpriseDoc);

      console.log("✅ Empresa criada com sucesso:", enterpriseDoc);
      return enterpriseDoc;
    } catch (error) {
      console.error("❌ Erro ao criar empresa:", error);
      throw error;
    }
  },

  // Buscar empresa por email
  async getEnterpriseByEmail(email) {
    try {
      console.log("🔍 getEnterpriseByEmail - Buscando email:", email);
      const enterpriseRef = doc(db, "enterprises", email);
      const enterpriseDoc = await getDoc(enterpriseRef);

      console.log(
        "📋 getEnterpriseByEmail - Documento existe?",
        enterpriseDoc.exists()
      );

      if (enterpriseDoc.exists()) {
        const result = { id: enterpriseDoc.id, ...enterpriseDoc.data() };
        console.log("✅ getEnterpriseByEmail - Empresa encontrada:", result);
        return result;
      }

      console.log(
        "🔍 getEnterpriseByEmail - Nenhuma empresa encontrada para email:",
        email
      );
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar empresa por email:", error);
      throw error;
    }
  },

  // Listar todas as empresas
  async getEnterprises() {
    try {
      const enterprisesRef = collection(db, "enterprises");
      const q = query(enterprisesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const enterprises = [];
      querySnapshot.forEach((doc) => {
        enterprises.push({ id: doc.id, ...doc.data() });
      });

      return enterprises;
    } catch (error) {
      console.error("❌ Erro ao listar empresas:", error);
      throw error;
    }
  },

  // Atualizar empresa
  async updateEnterprise(email, updateData) {
    try {
      const enterpriseRef = doc(db, "enterprises", email);

      // Verificar se o documento existe antes de tentar atualizar
      const enterpriseDoc = await getDoc(enterpriseRef);
      if (!enterpriseDoc.exists()) {
        throw new Error(
          `Empresa com email ${email} não encontrada no Firestore`
        );
      }

      const updatedData = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(enterpriseRef, updatedData);
      console.log("✅ Empresa atualizada:", email);

      // Retornar dados atualizados
      const updatedDoc = await getDoc(enterpriseRef);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error("❌ Erro ao atualizar empresa:", error);
      throw error;
    }
  },

  // Bloquear/desbloquear empresa
  async toggleBlockEnterprise(email) {
    try {
      const enterprise = await this.getEnterpriseByEmail(email);
      if (!enterprise) {
        throw new Error("Empresa não encontrada");
      }

      const newBlockedStatus = !enterprise.blocked;
      await this.updateEnterprise(email, { blocked: newBlockedStatus });

      return newBlockedStatus;
    } catch (error) {
      console.error("❌ Erro ao alterar status de bloqueio:", error);
      throw error;
    }
  },

  // Ativar/desativar empresa
  async toggleActiveEnterprise(email) {
    try {
      const enterprise = await this.getEnterpriseByEmail(email);
      if (!enterprise) {
        throw new Error("Empresa não encontrada");
      }

      const newActiveStatus = !enterprise.active;
      await this.updateEnterprise(email, { active: newActiveStatus });

      return newActiveStatus;
    } catch (error) {
      console.error("❌ Erro ao alterar status ativo:", error);
      throw error;
    }
  },

  // Excluir empresa
  async deleteEnterprise(email) {
    try {
      const enterpriseRef = doc(db, "enterprises", email);
      await deleteDoc(enterpriseRef);
      console.log("✅ Empresa excluída:", email);
      return true;
    } catch (error) {
      console.error("❌ Erro ao excluir empresa:", error);
      throw error;
    }
  },
};
