import {
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import { storage, auth } from "./firebase";

class ModernPhotoService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  }

  // Garante autenticação anônima
  async ensureAuth() {
    try {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
          console.log("Autenticação anônima realizada");
        } catch (error) {
          // Se anônimo estiver desabilitado, seguir sem auth (regras de Storage podem permitir)
          const code = error?.code || "";
          if (
            code === "auth/operation-not-allowed" ||
            code === "auth/admin-restricted-operation"
          ) {
            console.warn(
              "Auth anônima desabilitada; prosseguindo sem autenticação. Verifique as regras do Storage."
            );
            return true;
          }
          throw error;
        }
      }
      return true;
    } catch (error) {
      console.error("Erro na autenticação anônima:", error);
      return false;
    }
  }

  // Valida o arquivo
  validateFile(file) {
    if (!file) {
      throw new Error("Nenhum arquivo selecionado");
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error("Tipo de arquivo não suportado. Use JPEG, PNG ou WebP");
    }

    if (file.size > this.maxFileSize) {
      throw new Error("Arquivo muito grande. Máximo 5MB");
    }

    return true;
  }

  // Comprime a imagem se necessário
  async compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Define dimensões máximas
        const maxWidth = 800;
        const maxHeight = 800;

        let { width, height } = img;

        // Calcula novas dimensões mantendo proporção
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

        // Desenha a imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para blob
        canvas.toBlob(resolve, "image/jpeg", 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Upload com progresso
  async uploadUserPhoto(userId, file, onProgress = null) {
    try {
      console.log("📸 modernPhotoService.uploadUserPhoto chamado:", {
        userId,
        fileName: file.name,
      });

      // Garante autenticação
      const isAuth = await this.ensureAuth();
      if (!isAuth) {
        throw new Error("Falha na autenticação");
      }

      // Valida arquivo
      this.validateFile(file);

      // Comprime se necessário
      const compressedFile = await this.compressImage(file);
      console.log("📸 Arquivo comprimido:", {
        originalSize: file.size,
        compressedSize: compressedFile.size,
      });

      // Cria referência do arquivo
      const timestamp = Date.now();
      const fileName = `user-photos/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, fileName);

      console.log("📸 Fazendo upload para:", fileName);

      // Upload com acompanhamento de progresso
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (onProgress) {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            }
          },
          (error) => {
            console.error("📸 Erro no upload:", error);
            reject(new Error(`Erro no upload: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("📸 Upload concluído:", { downloadURL, fileName });
              resolve({
                url: downloadURL,
                path: fileName,
                size: compressedFile.size,
              });
            } catch (error) {
              console.error("📸 Erro ao obter URL:", error);
              reject(new Error(`Erro ao obter URL: ${error.message}`));
            }
          }
        );
      });
    } catch (error) {
      console.error("Erro no upload de foto:", error);
      throw error;
    }
  }

  // Upload com progresso para funcionários
  async uploadStaffPhoto(enterpriseEmail, staffId, file, onProgress = null) {
    try {
      console.log("📸 modernPhotoService.uploadStaffPhoto chamado:", {
        enterpriseEmail,
        staffId,
        fileName: file.name,
      });

      // Garante autenticação
      const isAuth = await this.ensureAuth();
      if (!isAuth) {
        throw new Error("Falha na autenticação");
      }

      // Valida arquivo
      this.validateFile(file);

      // Comprime se necessário
      const compressedFile = await this.compressImage(file);
      console.log("📸 Arquivo comprimido:", {
        originalSize: file.size,
        compressedSize: compressedFile.size,
      });

      // Cria referência do arquivo
      const timestamp = Date.now();
      const fileName = `staff-photos/${enterpriseEmail}/${staffId}/${timestamp}.jpg`;
      const storageRef = ref(storage, fileName);

      console.log("📸 Fazendo upload para:", fileName);

      // Upload com acompanhamento de progresso
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (onProgress) {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            }
          },
          (error) => {
            console.error("📸 Erro no upload da foto do funcionário:", error);
            reject(new Error(`Erro no upload: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("📸 Upload da foto do funcionário concluído:", {
                downloadURL,
                fileName,
              });
              resolve({
                url: downloadURL,
                path: fileName,
                size: compressedFile.size,
              });
            } catch (error) {
              console.error(
                "📸 Erro ao obter URL da foto do funcionário:",
                error
              );
              reject(new Error(`Erro ao obter URL: ${error.message}`));
            }
          }
        );
      });
    } catch (error) {
      console.error("Erro no upload de foto do funcionário:", error);
      throw error;
    }
  }

  // Delete foto
  async deleteUserPhoto(photoPath) {
    try {
      await this.ensureAuth();

      if (!photoPath) {
        throw new Error("Caminho da foto não fornecido");
      }

      const photoRef = ref(storage, photoPath);
      await deleteObject(photoRef);

      return true;
    } catch (error) {
      console.error("Erro ao deletar foto:", error);
      throw new Error(`Erro ao deletar foto: ${error.message}`);
    }
  }

  // Obtém URL de download
  async getPhotoURL(photoPath) {
    try {
      if (!photoPath) return null;

      const photoRef = ref(storage, photoPath);
      const url = await getDownloadURL(photoRef);
      return url;
    } catch (error) {
      console.error("Erro ao obter URL da foto:", error);
      return null;
    }
  }

  // Upload direto de data URL (para webcam)
  async uploadFromDataURL(userId, dataURL, onProgress = null) {
    try {
      // Converte data URL para blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Cria file object
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

      return await this.uploadUserPhoto(userId, file, onProgress);
    } catch (error) {
      console.error("Erro no upload de data URL:", error);
      throw error;
    }
  }
}

// Instância singleton
const modernPhotoService = new ModernPhotoService();
export default modernPhotoService;
