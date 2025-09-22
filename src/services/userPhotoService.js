import { storage } from "./firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firebaseAuthService } from "./firebaseAuthService";
import { v4 as uuidv4 } from "uuid";

/**
 * Serviço para gerenciar fotos de usuários no Firebase Storage
 */
class UserPhotoService {
  constructor() {
    this.basePath = "user-photos";
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  }

  /**
   * Valida o arquivo antes do upload
   */
  validateFile(file) {
    if (!file) {
      throw new Error("Nenhum arquivo foi selecionado");
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(
        "Formato de arquivo não suportado. Use JPEG, PNG ou WebP"
      );
    }

    if (file.size > this.maxFileSize) {
      throw new Error("Arquivo muito grande. Máximo permitido: 5MB");
    }

    return true;
  }

  /**
   * Redimensiona uma imagem para otimizar o upload
   */
  async resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(resolve, "image/jpeg", quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Gera um nome único para o arquivo
   */
  generateFileName(userId, originalName) {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    const extension = originalName.split(".").pop();
    return `${userId}_${timestamp}_${uuid}.${extension}`;
  }

  /**
   * Faz upload da foto do usuário
   */
  async uploadUserPhoto(userId, file, options = {}) {
    try {
      // Garantir autenticação antes do upload
      console.log("🔐 Verificando autenticação...");
      await firebaseAuthService.ensureAnonymous();

      // Validar arquivo
      this.validateFile(file);

      // Redimensionar se necessário
      const shouldResize = options.resize !== false;
      const processedFile = shouldResize ? await this.resizeImage(file) : file;

      // Gerar nome único
      const fileName = this.generateFileName(userId, file.name);
      const filePath = `${this.basePath}/${userId}/${fileName}`;

      // Criar referência no Storage
      const storageRef = ref(storage, filePath);

      // Metadados do arquivo
      const metadata = {
        contentType: processedFile.type || "image/jpeg",
        customMetadata: {
          userId: userId.toString(),
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      };

      console.log("📤 Fazendo upload da foto...", {
        userId,
        fileName,
        filePath,
        fileSize: processedFile.size,
        contentType: metadata.contentType,
      });

      // Upload do arquivo com retry
      let snapshot;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          snapshot = await uploadBytes(storageRef, processedFile, metadata);
          break;
        } catch (uploadError) {
          attempts++;
          console.warn(`❌ Tentativa ${attempts} falhou:`, uploadError.message);

          if (attempts >= maxAttempts) {
            throw uploadError;
          }

          // Aguardar antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log("✅ Upload concluído com sucesso!", { downloadURL });

      return {
        success: true,
        url: downloadURL,
        path: filePath,
        fileName: fileName,
        size: processedFile.size,
        metadata: snapshot.metadata,
      };
    } catch (error) {
      console.error("❌ Erro no upload da foto:", error);

      // Tratamento específico para erros de CORS/Permissão
      if (error.code === "storage/unauthorized") {
        throw new Error(
          "Sem permissão para fazer upload. Verifique se está logado."
        );
      } else if (error.code === "storage/cors") {
        throw new Error("Erro de CORS. Verifique a configuração do Firebase.");
      } else if (error.code === "storage/quota-exceeded") {
        throw new Error("Cota de armazenamento excedida.");
      } else if (error.code === "storage/invalid-url") {
        throw new Error("URL de upload inválida. Verifique a configuração.");
      } else {
        throw new Error(`Falha no upload: ${error.message}`);
      }
    }
  }

  /**
   * Remove uma foto do usuário
   */
  async deleteUserPhoto(photoPath) {
    try {
      const storageRef = ref(storage, photoPath);
      await deleteObject(storageRef);

      console.log("🗑️ Foto removida com sucesso:", photoPath);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao remover foto:", error);

      // Se o arquivo não existe, considerar como sucesso
      if (error.code === "storage/object-not-found") {
        return { success: true, message: "Foto já foi removida" };
      }

      throw new Error(`Falha ao remover foto: ${error.message}`);
    }
  }

  /**
   * Lista todas as fotos de um usuário
   */
  async getUserPhotos(userId) {
    try {
      // Note: listAll requires Firebase Storage Rules to allow read access
      // For now, we'll return an empty array and rely on stored URLs
      console.log("📋 Listando fotos do usuário:", userId);
      return [];
    } catch (error) {
      console.error("❌ Erro ao listar fotos:", error);
      return [];
    }
  }

  /**
   * Obtém a URL de uma foto específica
   */
  async getPhotoURL(photoPath) {
    try {
      const storageRef = ref(storage, photoPath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("❌ Erro ao obter URL da foto:", error);
      return null;
    }
  }
}

export const userPhotoService = new UserPhotoService();
export default userPhotoService;
