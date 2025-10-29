/**
 * Serviço para detectar e corrigir problemas de conectividade do Firebase Storage
 */

export class FirebaseStorageConnectivityService {
  constructor() {
    this.testedDomains = new Map();
    this.preferredDomain = null;
  }

  /**
   * Testa se um domínio do Firebase Storage está acessível
   */
  async testStorageDomain(projectId, domain) {
    const testUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.${domain}/o`;

    try {
      console.log(`🔍 Testando conectividade: ${testUrl}`);

      // Teste com timeout curto para detectar problemas rapidamente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isAccessible = response.status < 500; // Aceita até erros de auth (4xx), mas não erros de server/dns
      console.log(
        `${isAccessible ? "✅" : "❌"} ${domain}: Status ${response.status}`
      );

      this.testedDomains.set(domain, isAccessible);
      return isAccessible;
    } catch (error) {
      console.log(`❌ ${domain}: ${error.name} - ${error.message}`);
      this.testedDomains.set(domain, false);
      return false;
    }
  }

  /**
   * Encontra o melhor domínio disponível para o Firebase Storage
   */
  async findBestStorageDomain(projectId) {
    if (this.preferredDomain) {
      console.log(`🚀 Usando domínio já testado: ${this.preferredDomain}`);
      return this.preferredDomain;
    }

    console.log(
      "🔍 Testando conectividade dos domínios do Firebase Storage..."
    );

    const domainsToTest = [
      "firebasestorage.app", // Novo domínio (pode ter problemas de DNS)
      "appspot.com", // Domínio legacy (mais compatível)
    ];

    for (const domain of domainsToTest) {
      const isAccessible = await this.testStorageDomain(projectId, domain);
      if (isAccessible) {
        this.preferredDomain = domain;
        console.log(`✅ Melhor domínio encontrado: ${domain}`);
        return domain;
      }
    }

    // Se nenhum funcionou, usa o legacy como última tentativa
    console.warn(
      "⚠️ Nenhum domínio testado funcionou, usando appspot.com como fallback"
    );
    this.preferredDomain = "appspot.com";
    return this.preferredDomain;
  }

  /**
   * Retorna a configuração otimizada do Storage Bucket
   */
  async getOptimizedStorageBucket(projectId) {
    const bestDomain = await this.findBestStorageDomain(projectId);
    const bucket = `${projectId}.${bestDomain}`;

    console.log(`🔧 Bucket otimizado: ${bucket}`);
    return bucket;
  }

  /**
   * Limpa cache de testes (útil para re-testar)
   */
  clearCache() {
    this.testedDomains.clear();
    this.preferredDomain = null;
    console.log("🧹 Cache de conectividade limpo");
  }

  /**
   * Retorna relatório de conectividade
   */
  getConnectivityReport() {
    return {
      testedDomains: Object.fromEntries(this.testedDomains),
      preferredDomain: this.preferredDomain,
      hasConnectivityIssues: Array.from(this.testedDomains.values()).includes(
        false
      ),
    };
  }
}

// Instância singleton
export const firebaseConnectivity = new FirebaseStorageConnectivityService();
