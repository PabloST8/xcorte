import { storage } from "./firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Serviço simplificado para upload sem autenticação (desenvolvimento)
 */
class SimpleUploadService {
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
   * Upload direto sem autenticação
   */
  async uploadPhoto(userId, file, options = {}) {
    try {
      console.log("🚀 Upload direto sem autenticação...");

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
          uploadMethod: "direct-no-auth",
        },
      };

      console.log("📤 Iniciando upload...", {
        userId,
        fileName,
        filePath,
        fileSize: processedFile.size,
        contentType: metadata.contentType,
      });

      // Upload direto
      const snapshot = await uploadBytes(storageRef, processedFile, metadata);

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log("✅ Upload concluído!", { downloadURL });

      return {
        success: true,
        url: downloadURL,
        path: filePath,
        fileName: fileName,
        size: processedFile.size,
        metadata: snapshot.metadata,
      };
    } catch (error) {
      console.error("❌ Erro no upload:", error);

      if (error.code === "storage/unauthorized") {
        throw new Error("Sem permissão. Verifique as regras do Storage.");
      } else if (error.code === "storage/cors") {
        throw new Error("Erro de CORS. Verifique a configuração.");
      } else {
        throw new Error(`Upload falhou: ${error.message}`);
      }
    }
  }

  /**
   * Remove uma foto
   */
  async deletePhoto(photoPath) {
    try {
      const storageRef = ref(storage, photoPath);
      await deleteObject(storageRef);

      console.log("🗑️ Foto removida:", photoPath);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao remover:", error);

      if (error.code === "storage/object-not-found") {
        return { success: true, message: "Foto já foi removida" };
      }

      throw new Error(`Falha ao remover: ${error.message}`);
    }
  }
}

export const simpleUploadService = new SimpleUploadService();
export default simpleUploadService;
