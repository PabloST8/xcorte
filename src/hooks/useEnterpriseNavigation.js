import { useNavigate, useParams } from "react-router-dom";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { enterpriseCandidates } from "../utils/slug";

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

  return {
    navigateToPage,
    navigateToHome,
    navigateToEnterprise,
    navigateToEnterpriseSelector,
    forceNavigateToEnterprise,
    getEnterpriseUrl,
    isEnterpriseActive,
    currentSlug: enterpriseSlug,
  };
}
