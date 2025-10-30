// Serviço para sincronizar fotos de empresas com o Firestore
// Garante que as fotos estejam sempre disponíveis quando o usuário faz login

import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const enterprisePhotoSyncService = {
  // Cache local das fotos
  _photoCache: new Map(),
  _listeners: new Map(),

  // Inicializar sincronização de foto para uma empresa
  async initializePhotoSync(enterpriseId) {
    try {
      console.log("📷 Inicializando sincronização de foto para:", enterpriseId);

      // Buscar foto atual do Firestore
      const currentPhoto = await this.getCurrentPhotoFromFirestore(
        enterpriseId
      );

      if (currentPhoto.photoURL) {
        console.log("✅ Foto encontrada no Firestore:", currentPhoto.photoURL);
        this._photoCache.set(enterpriseId, currentPhoto);
      } else {
        console.log("📸 Nenhuma foto encontrada no Firestore");
      }

      // Configurar listener em tempo real para mudanças na foto
      this.setupPhotoListener(enterpriseId);

      return currentPhoto;
    } catch (error) {
      console.error("❌ Erro ao inicializar sincronização de foto:", error);
      return { photoURL: null, photoPath: null, photoUpdatedAt: null };
    }
  },

  // Buscar foto atual do Firestore
  async getCurrentPhotoFromFirestore(enterpriseId) {
    try {
      console.log("📸 Buscando foto do Firestore para:", enterpriseId);

      const enterpriseRef = doc(db, "enterprises", enterpriseId);
      const enterpriseDoc = await getDoc(enterpriseRef);

      if (enterpriseDoc.exists()) {
        const data = enterpriseDoc.data();
        const photoData = {
          photoURL: data.photoURL || null,
          photoPath: data.photoPath || null,
          photoUpdatedAt: data.photoUpdatedAt || null,
        };

        console.log("📸 Dados da foto encontrados:", photoData);
        return photoData;
      }

      console.log("📸 Documento da empresa não encontrado");
      return { photoURL: null, photoPath: null, photoUpdatedAt: null };
    } catch (error) {
      console.error("❌ Erro ao buscar foto do Firestore:", error);
      return { photoURL: null, photoPath: null, photoUpdatedAt: null };
    }
  },

  // Configurar listener em tempo real para mudanças na foto
  setupPhotoListener(enterpriseId) {
    try {
      // Remover listener anterior se existir
      if (this._listeners.has(enterpriseId)) {
        console.log("🔄 Removendo listener anterior para:", enterpriseId);
        this._listeners.get(enterpriseId)();
      }

      console.log("👂 Configurando listener de foto para:", enterpriseId);

      const enterpriseRef = doc(db, "enterprises", enterpriseId);
      const unsubscribe = onSnapshot(
        enterpriseRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const newPhotoData = {
              photoURL: data.photoURL || null,
              photoPath: data.photoPath || null,
              photoUpdatedAt: data.photoUpdatedAt || null,
            };

            // Verificar se houve mudança na foto
            const cachedPhoto = this._photoCache.get(enterpriseId);
            if (
              !cachedPhoto ||
              cachedPhoto.photoURL !== newPhotoData.photoURL
            ) {
              console.log("📸 Foto atualizada em tempo real:", newPhotoData);
              this._photoCache.set(enterpriseId, newPhotoData);

              // Disparar evento customizado para notificar componentes
              this._notifyPhotoUpdate(enterpriseId, newPhotoData);
            }
          }
        },
        (error) => {
          console.error("❌ Erro no listener de foto:", error);
        }
      );

      this._listeners.set(enterpriseId, unsubscribe);
    } catch (error) {
      console.error("❌ Erro ao configurar listener de foto:", error);
    }
  },

  // Notificar componentes sobre atualização de foto
  _notifyPhotoUpdate(enterpriseId, photoData) {
    try {
      const event = new CustomEvent("enterprisePhotoUpdated", {
        detail: { enterpriseId, photoData },
      });
      window.dispatchEvent(event);
      console.log("📢 Evento de atualização de foto disparado:", enterpriseId);
    } catch (error) {
      console.error("❌ Erro ao disparar evento de foto:", error);
    }
  },

  // Obter foto do cache local
  getCachedPhoto(enterpriseId) {
    return (
      this._photoCache.get(enterpriseId) || {
        photoURL: null,
        photoPath: null,
        photoUpdatedAt: null,
      }
    );
  },

  // Sincronizar foto com dados da empresa
  async syncPhotoWithEnterprise(enterprise) {
    if (!enterprise || (!enterprise.id && !enterprise.email)) {
      console.warn("⚠️ Empresa inválida para sincronização de foto");
      return enterprise;
    }

    // Usar ID se disponível, senão usar email como identificador
    const enterpriseId = enterprise.id || enterprise.email;

    try {
      console.log("🔄 Sincronizando foto com empresa:", enterpriseId);

      // Buscar foto mais recente do Firestore
      const photoData = await this.getCurrentPhotoFromFirestore(enterpriseId);

      // Mesclar dados da foto com dados da empresa
      const updatedEnterprise = {
        ...enterprise,
        ...photoData,
      };

      console.log("✅ Empresa sincronizada com foto:", {
        name: updatedEnterprise.name,
        hasPhoto: !!updatedEnterprise.photoURL,
        photoURL: updatedEnterprise.photoURL,
      });

      return updatedEnterprise;
    } catch (error) {
      console.error("❌ Erro ao sincronizar foto com empresa:", error);
      return enterprise;
    }
  },

  // Limpar listeners ao sair
  cleanup(enterpriseId = null) {
    if (enterpriseId) {
      // Limpar listener específico
      if (this._listeners.has(enterpriseId)) {
        this._listeners.get(enterpriseId)();
        this._listeners.delete(enterpriseId);
        this._photoCache.delete(enterpriseId);
        console.log("🧹 Listener de foto removido para:", enterpriseId);
      }
    } else {
      // Limpar todos os listeners
      this._listeners.forEach((unsubscribe) => unsubscribe());
      this._listeners.clear();
      this._photoCache.clear();
      console.log("🧹 Todos os listeners de foto removidos");
    }
  },
};
