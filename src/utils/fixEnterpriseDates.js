import { firestoreEnterpriseService } from "../services/firestoreEnterpriseService";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const fixEnterpriseDates = async () => {
  try {
    console.log("🔧 Corrigindo datas e campos das empresas...");

    // Buscar todas as empresas
    const enterprises = await firestoreEnterpriseService.getEnterprises();

    for (const enterprise of enterprises) {
      const updates = {};
      let needsUpdate = false;

      console.log(
        `🔍 Verificando empresa: ${enterprise.name} (ID: ${enterprise.id}, Email: ${enterprise.email})`
      );

      // Verificar se o documento realmente existe no Firestore
      // Usar o ID da empresa em vez do email se for diferente

      try {
        let existingDoc;

        // Tentar buscar pelo ID primeiro
        if (enterprise.id && enterprise.id !== enterprise.email) {
          console.log(
            `🔍 Tentando buscar empresa ${enterprise.name} pelo ID: ${enterprise.id}`
          );
          const enterpriseRef = doc(db, "enterprises", enterprise.id);
          const docSnapshot = await getDoc(enterpriseRef);
          if (docSnapshot.exists()) {
            existingDoc = { id: docSnapshot.id, ...docSnapshot.data() };
          }
        }

        // Se não encontrou pelo ID, tentar pelo email
        if (!existingDoc) {
          console.log(
            `🔍 Tentando buscar empresa ${enterprise.name} pelo email: ${enterprise.email}`
          );
          existingDoc = await firestoreEnterpriseService.getEnterpriseByEmail(
            enterprise.email
          );
        }

        if (!existingDoc) {
          console.log(
            `⚠️ Empresa ${enterprise.name} não encontrada no Firestore (ID: ${enterprise.id}, Email: ${enterprise.email}), pulando...`
          );
          continue;
        }
      } catch (error) {
        console.log(
          `⚠️ Erro ao verificar empresa ${enterprise.name}, pulando:`,
          error.message
        );
        continue;
      }

      // Verificar se precisa atualizar as datas
      if (typeof enterprise.createdAt === "string") {
        console.log(`🔧 Corrigindo createdAt para: ${enterprise.name}`);
        const createdDate = new Date(enterprise.createdAt);
        updates.createdAt = Timestamp.fromDate(createdDate);
        needsUpdate = true;
      }

      // Converter updatedAt se for string
      if (typeof enterprise.updatedAt === "string") {
        console.log(`🔧 Corrigindo updatedAt para: ${enterprise.name}`);
        const updatedDate = new Date(enterprise.updatedAt);
        updates.updatedAt = Timestamp.fromDate(updatedDate);
        needsUpdate = true;
      }

      // Verificar e corrigir campo active se não existir ou for undefined/null
      if (enterprise.active === undefined || enterprise.active === null) {
        console.log(`🔧 Definindo active=true para: ${enterprise.name}`);
        updates.active = true;
        needsUpdate = true;
      }

      // Verificar e corrigir campo blocked se não existir ou for undefined/null
      if (enterprise.blocked === undefined || enterprise.blocked === null) {
        console.log(`🔧 Definindo blocked=false para: ${enterprise.name}`);
        updates.blocked = false;
        needsUpdate = true;
      }

      // Se há algum campo para atualizar
      if (needsUpdate) {
        try {
          if (enterprise.id && enterprise.id !== enterprise.email) {
            // Atualizar diretamente pelo ID
            const enterpriseRef = doc(db, "enterprises", enterprise.id);
            const updatedData = {
              ...updates,
              updatedAt: Timestamp.now(),
            };

            await updateDoc(enterpriseRef, updatedData);
            console.log(
              `✅ Campos corrigidos para: ${enterprise.name} (pelo ID: ${enterprise.id})`,
              updates
            );
          } else {
            // Usar o serviço normal pelo email
            await firestoreEnterpriseService.updateEnterprise(
              enterprise.email,
              updates
            );
            console.log(
              `✅ Campos corrigidos para: ${enterprise.name} (pelo email: ${enterprise.email})`,
              updates
            );
          }
        } catch (updateError) {
          console.error(
            `❌ Erro ao atualizar ${enterprise.name}:`,
            updateError.message
          );
        }
      } else {
        console.log(`✅ ${enterprise.name} já está com os campos corretos`);
      }
    }

    console.log("✅ Correção de empresas concluída!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao corrigir empresas:", error);
    throw error;
  }
};
