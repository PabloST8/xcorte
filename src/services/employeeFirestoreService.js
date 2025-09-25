import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { removeUndefinedFields } from "../utils/firebaseUtils";

// Coleção raiz: employees
// Schema:
// id (doc id = email ou auto)
// name, email, phone, enterpriseEmail, position, isActive, createdAt, updatedAt, avatarUrl
// skills: [ { productId, productName, canPerform, estimatedDuration, experienceLevel } ]
// workSchedule: { monday: { isWorking, startTime, endTime }, ... }

export const employeeFirestoreService = {
  async list(enterpriseEmail) {
    const q = query(
      collection(db, "employees"),
      where("enterpriseEmail", "==", enterpriseEmail)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    const id = data.email; // usar email como id para fácil consulta
    const ref = doc(db, "employees", id);
    const payload = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return { id, ...data };
  },

  async get(id) {
    const snap = await getDocs(
      query(collection(db, "employees"), where("email", "==", id))
    );
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
    return null;
  },

  async update(id, data) {
    const ref = doc(db, "employees", id);

    // Remover campos undefined para evitar erro do Firestore
    const cleanData = removeUndefinedFields(data);

    await updateDoc(ref, { ...cleanData, updatedAt: serverTimestamp() });
    return { id, ...data };
  },

  async remove(id) {
    console.log("🗑️ employeeFirestoreService.remove - ID recebido:", id);
    try {
      const ref = doc(db, "employees", id);
      console.log("📄 Referência do documento:", ref.path);
      await deleteDoc(ref);
      console.log("✅ Documento deletado com sucesso");
      return true;
    } catch (error) {
      console.error("❌ Erro ao deletar documento:", error);
      throw error;
    }
  },

  // Atualizar referências de serviços em todos os funcionários
  async updateServiceReferences(
    enterpriseEmail,
    serviceId,
    updatedServiceData
  ) {
    try {
      console.log(
        "🔄 Atualizando referências do serviço:",
        serviceId,
        "para empresa:",
        enterpriseEmail
      );

      // Buscar todos os funcionários da empresa
      const q = query(
        collection(db, "employees"),
        where("enterpriseEmail", "==", enterpriseEmail)
      );
      const snap = await getDocs(q);

      const updatePromises = [];

      snap.docs.forEach((docSnap) => {
        const employee = docSnap.data();
        const employeeSkills = employee.skills || [];

        // Verificar se o funcionário tem habilidade neste serviço
        const skillIndex = employeeSkills.findIndex(
          (skill) => skill.productId === serviceId
        );

        if (skillIndex !== -1) {
          // Atualizar o nome do produto/serviço
          const updatedSkills = [...employeeSkills];
          updatedSkills[skillIndex] = {
            ...updatedSkills[skillIndex],
            productName: updatedServiceData.name,
          };

          // Adicionar à lista de atualizações
          const employeeRef = doc(db, "employees", docSnap.id);
          updatePromises.push(
            updateDoc(employeeRef, {
              skills: updatedSkills,
              updatedAt: new Date().toISOString(),
            })
          );

          console.log(
            `📝 Atualizando funcionário ${docSnap.id} - serviço: ${updatedServiceData.name}`
          );
        }
      });

      // Executar todas as atualizações
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(
          `✅ ${updatePromises.length} funcionários atualizados com sucesso`
        );
      } else {
        console.log("ℹ️ Nenhum funcionário encontrado com esse serviço");
      }

      return { success: true, updatedEmployees: updatePromises.length };
    } catch (error) {
      console.error("❌ Erro ao atualizar referências de serviços:", error);
      throw error;
    }
  },

  // Remover referências de serviços de todos os funcionários
  async removeServiceReferences(enterpriseEmail, serviceId) {
    try {
      console.log(
        "🗑️ Removendo referências do serviço:",
        serviceId,
        "para empresa:",
        enterpriseEmail
      );

      // Buscar todos os funcionários da empresa
      const q = query(
        collection(db, "employees"),
        where("enterpriseEmail", "==", enterpriseEmail)
      );
      const snap = await getDocs(q);

      const updatePromises = [];

      snap.docs.forEach((docSnap) => {
        const employee = docSnap.data();
        const employeeSkills = employee.skills || [];

        // Filtrar para remover a habilidade do serviço deletado
        const updatedSkills = employeeSkills.filter(
          (skill) => skill.productId !== serviceId
        );

        // Se houve mudança, atualizar o funcionário
        if (updatedSkills.length !== employeeSkills.length) {
          const employeeRef = doc(db, "employees", docSnap.id);
          updatePromises.push(
            updateDoc(employeeRef, {
              skills: updatedSkills,
              updatedAt: new Date().toISOString(),
            })
          );

          console.log(`🗑️ Removendo serviço do funcionário ${docSnap.id}`);
        }
      });

      // Executar todas as atualizações
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(
          `✅ Referências removidas de ${updatePromises.length} funcionários`
        );
      } else {
        console.log("ℹ️ Nenhum funcionário encontrado com esse serviço");
      }

      return { success: true, updatedEmployees: updatePromises.length };
    } catch (error) {
      console.error("❌ Erro ao remover referências de serviços:", error);
      throw error;
    }
  },
};
