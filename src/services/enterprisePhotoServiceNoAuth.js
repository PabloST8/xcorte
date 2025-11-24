// Serviço alternativo para upload sem autenticação anônima
// Usa apenas as regras permissivas do Firebase Storage

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { storage, db } from "./firebase";

export const enterprisePhotoServiceNoAuth = {
  // Upload de foto da empresa SEM autenticação anônima
  async uploadPhoto(enterpriseId, file) {
    try {
      console.log("📤 INICIANDO UPLOAD SEM AUTENTICAÇÃO ANÔNIMA");

      // Validação do enterpriseId
      if (!enterpriseId) {
        throw new Error("Enterprise ID é obrigatório para upload de foto");
      }

      console.log("📤 STEP 1: Dados do upload:", {
        enterpriseId,
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

      // Sanitizar enterpriseId para uso em path
      const sanitizedEnterpriseId = String(enterpriseId)
        .replace(/[^a-zA-Z0-9@.-]/g, "_")
        .replace(/\s+/g, "_");

      console.log(
        "📁 STEP 2: Path criado:",
        `enterprise-photos/${sanitizedEnterpriseId}/${fileName}`
      );

      const photoRef = ref(
        storage,
        `enterprise-photos/${sanitizedEnterpriseId}/${fileName}`
      );

      console.log("🔧 STEP 3: Storage configurado:", {
        bucket: storage.app.options.storageBucket,
        fullPath: photoRef.fullPath,
      });

      // Upload direto SEM autenticação
      console.log("🚀 STEP 4: Iniciando upload direto...");

      const uploadTask = uploadBytesResumable(photoRef, file, {
        contentType: file.type,
        customMetadata: {
          uploaded_by: "enterprise_photo_service_no_auth",
          enterprise_id: enterpriseId,
          upload_timestamp: timestamp.toString(),
        },
      });

      // Monitorar progresso do upload
      const uploadPromise = new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`📈 Upload progress: ${progress.toFixed(1)}%`);
          },
          (error) => {
            console.error("❌ Erro durante upload:", error);
            reject(error);
          },
          () => {
            console.log("✅ Upload concluído com sucesso");
            resolve(uploadTask.snapshot);
          }
        );
      });

      // Aguardar conclusão do upload
      const snapshot = await uploadPromise;
      console.log("📷 STEP 5: Arquivo uploaded:", snapshot.metadata.fullPath);

      // Obter URL de download
      const downloadURL = await getDownloadURL(photoRef);
      console.log("🔗 STEP 6: URL obtida:", downloadURL);

      // Atualizar documento da empresa no Firestore
      const enterpriseRef = doc(db, "enterprises", enterpriseId);
      await updateDoc(enterpriseRef, {
        photoURL: downloadURL,
        photoPath: snapshot.metadata.fullPath,
        photoUpdatedAt: new Date(),
      });

      console.log("✅ STEP 7: Foto da empresa atualizada no Firestore");

      return {
        success: true,
        photoURL: downloadURL,
        photoPath: snapshot.metadata.fullPath,
      };
    } catch (error) {
      console.error("❌ Erro no upload da foto:", error);

      // Log detalhado do erro
      if (error.code) {
        console.error("🔍 Código do erro:", error.code);
      }
      if (error.serverResponse) {
        console.error("🌐 Resposta do servidor:", error.serverResponse);
      }

      throw error;
    }
  },

  // Métodos auxiliares (iguais ao serviço original)
  async deletePhoto(photoPath) {
    try {
      if (!photoPath) return;

      const photoRef = ref(storage, photoPath);
      await deleteObject(photoRef);
      console.log("🗑️ Foto anterior deletada:", photoPath);
    } catch (error) {
      console.warn("⚠️ Erro ao deletar foto anterior:", error);
    }
  },

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
