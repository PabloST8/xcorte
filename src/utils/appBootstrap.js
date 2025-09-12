import { publicEnterpriseFirestoreService } from "../services/publicEnterpriseFirestoreService";
import Cookies from "js-cookie";

class AppBootstrap {
  constructor() {
    this.initialized = false;
    this.enterprises = [];
    this.currentEnterprise = null;
  }

  async initialize() {
    if (this.initialized) return;

    const startTime = performance.now();
    console.log("🚀 Iniciando bootstrap da aplicação...");

    try {
      // Primeiro tenta usar dados em cache
      const cached = this.loadFromCache();
      if (cached) {
        console.log(
          "✅ Dados carregados do cache",
          performance.now() - startTime,
          "ms"
        );
        this.initialized = true;
        return;
      }

      // Se não há cache, carrega do Firestore
      const enterprises =
        await publicEnterpriseFirestoreService.getEnterprises();
      this.enterprises = enterprises;

      if (enterprises.length > 0) {
        this.currentEnterprise = enterprises[0];
        this.saveToCache();
      }

      console.log("✅ Bootstrap completo", performance.now() - startTime, "ms");
      this.initialized = true;
    } catch (error) {
      console.error("❌ Erro no bootstrap:", error);
      // Mesmo com erro, marca como inicializado para não travar
      this.initialized = true;
    }
  }

  loadFromCache() {
    try {
      const savedStr = Cookies.get("current_enterprise");
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        this.currentEnterprise = saved;
        this.enterprises = [saved];
        return true;
      }
    } catch {
      Cookies.remove("current_enterprise");
    }
    return false;
  }

  saveToCache() {
    if (this.currentEnterprise) {
      Cookies.set(
        "current_enterprise",
        JSON.stringify(this.currentEnterprise),
        {
          expires: 30,
        }
      );
    }
  }

  getEnterprises() {
    return this.enterprises;
  }

  getCurrentEnterprise() {
    return this.currentEnterprise;
  }

  isInitialized() {
    return this.initialized;
  }
}

// Instância singleton
export const appBootstrap = new AppBootstrap();

// Inicia o bootstrap imediatamente quando o módulo é carregado
appBootstrap.initialize();
