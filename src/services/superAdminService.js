import { db } from "./firebase";
import { superAdminAuthService } from "./superAdminAuthService";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";

class SuperAdminService {
  constructor() {
    this.collectionName = "enterprises";
  }

  // Verificar se o usuário está autenticado como super admin
  async ensureAuthenticated() {
    if (!superAdminAuthService.isAuthenticated()) {
      throw new Error("Usuário não autenticado");
    }

    const isSuperAdmin = await superAdminAuthService.isSuperAdmin();
    if (!isSuperAdmin) {
      throw new Error(
        "Acesso negado. Apenas Super Admins podem realizar esta operação."
      );
    }
  }

  // Buscar todas as empresas
  async getEnterprises() {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const enterprises = [];

      querySnapshot.forEach((doc) => {
        enterprises.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log("📋 Empresas carregadas:", enterprises.length);
      return enterprises;
    } catch (error) {
      console.error("❌ Erro ao buscar empresas:", error);
      throw error;
    }
  }

  // Buscar empresa por ID
  async getEnterpriseById(enterpriseId) {
    try {
      const docRef = doc(db, this.collectionName, enterpriseId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Empresa não encontrada");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar empresa:", error);
      throw error;
    }
  }

  // Criar nova empresa
  async createEnterprise(enterpriseData) {
    try {
      await this.ensureAuthenticated();

      // Validar se email já existe
      const existingEnterprise = await this.checkEmailExists(
        enterpriseData.email
      );
      if (existingEnterprise) {
        throw new Error("Já existe uma empresa com este email");
      }

      const newEnterprise = {
        ...enterpriseData,
        isActive: true,
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        newEnterprise
      );

      console.log("✅ Empresa criada:", docRef.id);

      // Retornar a empresa criada
      return {
        id: docRef.id,
        ...newEnterprise,
      };
    } catch (error) {
      console.error("❌ Erro ao criar empresa:", error);
      throw error;
    }
  }

  // Atualizar empresa
  async updateEnterprise(enterpriseId, updateData) {
    try {
      await this.ensureAuthenticated();

      const docRef = doc(db, this.collectionName, enterpriseId);

      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updatedData);

      console.log("✅ Empresa atualizada:", enterpriseId);

      // Retornar empresa atualizada
      return await this.getEnterpriseById(enterpriseId);
    } catch (error) {
      console.error("❌ Erro ao atualizar empresa:", error);
      throw error;
    }
  }

  // Bloquear/desbloquear empresa
  async toggleBlockEnterprise(enterpriseId) {
    try {
      await this.ensureAuthenticated();

      const enterprise = await this.getEnterpriseById(enterpriseId);
      const newBlockedStatus = !enterprise.isBlocked;

      await this.updateEnterprise(enterpriseId, {
        isBlocked: newBlockedStatus,
      });

      console.log(
        `✅ Empresa ${newBlockedStatus ? "bloqueada" : "desbloqueada"}:`,
        enterpriseId
      );
      return newBlockedStatus;
    } catch (error) {
      console.error("❌ Erro ao alterar status da empresa:", error);
      throw error;
    }
  }

  // Ativar/desativar empresa
  async toggleActiveEnterprise(enterpriseId) {
    try {
      await this.ensureAuthenticated();

      const enterprise = await this.getEnterpriseById(enterpriseId);
      const newActiveStatus = !enterprise.isActive;

      await this.updateEnterprise(enterpriseId, {
        isActive: newActiveStatus,
      });

      console.log(
        `✅ Empresa ${newActiveStatus ? "ativada" : "desativada"}:`,
        enterpriseId
      );
      return newActiveStatus;
    } catch (error) {
      console.error("❌ Erro ao alterar status ativo da empresa:", error);
      throw error;
    }
  }

  // Excluir empresa (soft delete)
  async deleteEnterprise(enterpriseId) {
    try {
      await this.ensureAuthenticated();

      await this.updateEnterprise(enterpriseId, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });

      console.log("✅ Empresa excluída (soft delete):", enterpriseId);
    } catch (error) {
      console.error("❌ Erro ao excluir empresa:", error);
      throw error;
    }
  }

  // Excluir empresa permanentemente (hard delete)
  async permanentDeleteEnterprise(enterpriseId) {
    try {
      await this.ensureAuthenticated();

      const docRef = doc(db, this.collectionName, enterpriseId);
      await deleteDoc(docRef);

      console.log("✅ Empresa excluída permanentemente:", enterpriseId);
    } catch (error) {
      console.error("❌ Erro ao excluir empresa permanentemente:", error);
      throw error;
    }
  }

  // Verificar se email já existe
  async checkEmailExists(email) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("❌ Erro ao verificar email:", error);
      return false;
    }
  }

  // Buscar empresas por status
  async getEnterprisesByStatus(isActive = true, isBlocked = false) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("isActive", "==", isActive),
        where("isBlocked", "==", isBlocked),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const enterprises = [];

      querySnapshot.forEach((doc) => {
        enterprises.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return enterprises;
    } catch (error) {
      console.error("❌ Erro ao buscar empresas por status:", error);
      throw error;
    }
  }

  // Estatísticas das empresas
  async getEnterpriseStats() {
    try {
      const allEnterprises = await this.getEnterprises();

      const stats = {
        total: allEnterprises.length,
        active: allEnterprises.filter(
          (e) => e.isActive && !e.isBlocked && !e.isDeleted
        ).length,
        blocked: allEnterprises.filter((e) => e.isBlocked).length,
        inactive: allEnterprises.filter((e) => !e.isActive).length,
        deleted: allEnterprises.filter((e) => e.isDeleted).length,
      };

      return stats;
    } catch (error) {
      console.error("❌ Erro ao calcular estatísticas:", error);
      throw error;
    }
  }
}

export const superAdminService = new SuperAdminService();
