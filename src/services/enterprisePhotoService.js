// Serviço para gerenciar fotos de empresas
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { storage, db } from "./firebase";

export const enterprisePhotoService = {
  // Upload de foto da empresa
  async uploadPhoto(enterpriseId, file) {
    try {
      // Validação do enterpriseId
      if (!enterpriseId) {
        throw new Error("Enterprise ID é obrigatório para upload de foto");
      }

      console.log("📤 Iniciando upload da foto da empresa...", {
        enterpriseId,
        enterpriseIdType: typeof enterpriseId,
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
      });

      // Validações
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Tipo de arquivo não permitido. Use JPG, PNG ou WebP");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo 5MB");
      }

      // Criar referência única para a foto
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}.${fileExtension}`;

      // Sanitizar enterpriseId para uso em path (remover caracteres especiais)
      const sanitizedEnterpriseId = String(enterpriseId)
        .replace(/[^a-zA-Z0-9@.-]/g, "_")
        .replace(/\s+/g, "_");

      console.log(
        "📁 Criando path:",
        `enterprise-photos/${sanitizedEnterpriseId}/${fileName}`
      );

      const photoRef = ref(
        storage,
        `enterprise-photos/${sanitizedEnterpriseId}/${fileName}`
      );

      // Upload do arquivo
      const snapshot = await uploadBytes(photoRef, file);
      console.log("📷 Arquivo uploaded:", snapshot.metadata.fullPath);

      // Obter URL de download
      const downloadURL = await getDownloadURL(photoRef);
      console.log("🔗 URL de download obtida:", downloadURL);

      // Atualizar documento da empresa no Firestore
      const enterpriseRef = doc(db, "enterprises", enterpriseId);
      await updateDoc(enterpriseRef, {
        photoURL: downloadURL,
        photoPath: snapshot.metadata.fullPath,
        photoUpdatedAt: new Date(),
      });

      console.log("✅ Foto da empresa atualizada no Firestore");

      return {
        success: true,
        photoURL: downloadURL,
        photoPath: snapshot.metadata.fullPath,
      };
    } catch (error) {
      console.error("❌ Erro no upload da foto:", error);
      throw error;
    }
  },

  // Deletar foto anterior (opcional)
  async deletePhoto(photoPath) {
    try {
      if (!photoPath) return;

      const photoRef = ref(storage, photoPath);
      await deleteObject(photoRef);
      console.log("🗑️ Foto anterior deletada:", photoPath);
    } catch (error) {
      console.warn("⚠️ Erro ao deletar foto anterior:", error);
      // Não é um erro crítico, apenas log
    }
  },

  // Obter foto atual da empresa
  async getCurrentPhoto(enterpriseId) {
    try {
      const enterpriseRef = doc(db, "enterprises", enterpriseId);
      const enterpriseDoc = await getDoc(enterpriseRef);

      if (enterpriseDoc.exists()) {
        const data = enterpriseDoc.data();
        return {
          photoURL: data.photoURL || null,
          photoPath: data.photoPath || null,
          photoUpdatedAt: data.photoUpdatedAt || null,
        };
      }

      return null;
    } catch (error) {
      console.error("❌ Erro ao obter foto da empresa:", error);
      return null;
    }
  },
};
