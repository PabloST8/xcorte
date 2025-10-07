import { useNavigate, useParams } from "react-router-dom";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { enterpriseCandidates } from "../utils/slug";
import Cookies from "js-cookie";

/**
 * Hook para navegação dentro do contexto da empresa atual
 * Garante que todas as navegações mantenham o slug da empresa na URL
 */
export function useEnterpriseNavigation() {
  const navigate = useNavigate();
  const { enterpriseSlug } = useParams();
  const { currentEnterprise } = useEnterprise();

  /**
   * Navega para uma página dentro do contexto da empresa atual
   * @param {string} path - Caminho da página (ex: 'profile', 'appointments')
   * @param {object} options - Opções de navegação do React Router
   */
  const navigateToPage = (path, options = {}) => {
    if (!enterpriseSlug && currentEnterprise) {
      // Se não há slug na URL mas há empresa atual, usa o slug da empresa
      const slug = enterpriseCandidates(currentEnterprise)[0];
      navigate(`/${slug}/${path}`, options);
    } else if (enterpriseSlug) {
      // Se há slug na URL, mantém ele
      navigate(`/${enterpriseSlug}/${path}`, options);
    } else {
      // Fallback para rota global
      navigate(`/${path}`, options);
    }
  };

  /**
   * Navega para a página inicial da empresa atual
   * @param {object} options - Opções de navegação do React Router
   */
  const navigateToHome = (options = {}) => {
    if (!enterpriseSlug && currentEnterprise) {
      const slug = enterpriseCandidates(currentEnterprise)[0];
      navigate(`/${slug}`, options);
    } else if (enterpriseSlug) {
      navigate(`/${enterpriseSlug}`, options);
    } else {
      navigate("/", options);
    }
  };

  /**
   * Navega para uma empresa específica
   * @param {object} enterprise - Objeto da empresa
   * @param {string} path - Caminho opcional após o slug da empresa
   * @param {object} options - Opções de navegação do React Router
   */
  const navigateToEnterprise = (enterprise, path = "", options = {}) => {
    const slug = enterpriseCandidates(enterprise)[0];
    const fullPath = path ? `/${slug}/${path}` : `/${slug}`;
    navigate(fullPath, options);
  };

  /**
   * Navega para a página de seleção de empresas
   * @param {object} options - Opções de navegação do React Router
   */
  const navigateToEnterpriseSelector = (options = {}) => {
    navigate("/empresas", { ...options, replace: true });
  };

  /**
   * Força a navegação para uma empresa específica
   * @param {object} enterprise - Objeto da empresa
   * @param {string} path - Caminho opcional após o slug da empresa
   * @param {object} options - Opções de navegação do React Router
   */
  const forceNavigateToEnterprise = (enterprise, path = "", options = {}) => {
    const slug = enterpriseCandidates(enterprise)[0];
    const fullPath = path ? `/${slug}/${path}` : `/${slug}`;
    // Força reload da página para garantir que o contexto seja atualizado
    window.location.href = fullPath;
  };

  /**
   * Gera uma URL completa para uma página dentro do contexto da empresa atual
   * @param {string} path - Caminho da página
   * @returns {string} URL completa
   */
  const getEnterpriseUrl = (path = "") => {
    if (!enterpriseSlug && currentEnterprise) {
      const slug = enterpriseCandidates(currentEnterprise)[0];
      return path ? `/${slug}/${path}` : `/${slug}`;
    } else if (enterpriseSlug) {
      return path ? `/${enterpriseSlug}/${path}` : `/${enterpriseSlug}`;
    } else {
      return path ? `/${path}` : "/";
    }
  };

  /**
   * Verifica se uma empresa está atualmente ativa na URL
   * @param {object} enterprise - Objeto da empresa
   * @returns {boolean} True se a empresa está ativa
   */
  const isEnterpriseActive = (enterprise) => {
    if (!enterpriseSlug || !enterprise) return false;
    return enterpriseCandidates(enterprise).some(
      (candidate) => candidate === enterpriseSlug.toLowerCase()
    );
  };

  /**
   * Salva o contexto da empresa atual para preservar durante navegação auth
   */
  const saveEnterpriseContext = () => {
    if (enterpriseSlug) {
      Cookies.set("lastEnterpriseSlug", enterpriseSlug, { expires: 1 }); // 1 dia
    } else if (currentEnterprise) {
      const slug = enterpriseCandidates(currentEnterprise)[0];
      Cookies.set("lastEnterpriseSlug", slug, { expires: 1 });
    }
  };

  /**
   * Restaura o contexto da empresa salvo e limpa o cookie
   * @returns {string|null} O slug da empresa salva
   */
  const restoreEnterpriseContext = () => {
    const savedSlug = Cookies.get("lastEnterpriseSlug");
    if (savedSlug) {
      Cookies.remove("lastEnterpriseSlug");
      return savedSlug;
    }
    return null;
  };

  /**
   * Navega para auth preservando o contexto da empresa
   * @param {string} authPath - Caminho da página de auth (ex: "login", "register")
   */
  const navigateToAuth = (authPath) => {
    saveEnterpriseContext();
    navigate(`/auth/${authPath}`);
  };

  /**
   * Navega de volta da auth para a empresa preservada
   * @param {string} path - Caminho opcional dentro da empresa
   */
  const navigateFromAuth = (path = "") => {
    const savedSlug = restoreEnterpriseContext();
    if (savedSlug) {
      const fullPath = path ? `/${savedSlug}/${path}` : `/${savedSlug}`;
      navigate(fullPath);
    } else {
      navigate("/");
    }
  };

  return {
    navigateToPage,
    navigateToHome,
    navigateToEnterprise,
    navigateToEnterpriseSelector,
    forceNavigateToEnterprise,
    getEnterpriseUrl,
    isEnterpriseActive,
    saveEnterpriseContext,
    restoreEnterpriseContext,
    navigateToAuth,
    navigateFromAuth,
    currentSlug: enterpriseSlug,
  };
}
