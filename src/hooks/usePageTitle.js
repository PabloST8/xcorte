import { useEffect } from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";

/**
 * Hook para atualizar dinamicamente o título da página e favicon
 * baseado na empresa atualmente selecionada
 */
export const usePageTitle = () => {
  const { currentEnterprise, loading } = useEnterprise();

  useEffect(() => {
    if (loading) return;

    // Atualizar título da página
    const baseTitle = "Agendamentos";
    const enterpriseName =
      currentEnterprise?.name || currentEnterprise?.displayName;

    if (enterpriseName) {
      document.title = `${baseTitle} - ${enterpriseName}`;
    } else {
      document.title = baseTitle;
    }

    // Atualizar favicon se a empresa tiver logo
    const faviconElement = document.getElementById("favicon");
    if (faviconElement) {
      if (currentEnterprise?.logoUrl || currentEnterprise?.photoURL) {
        // Usar logo da empresa como favicon
        const logoUrl = currentEnterprise.logoUrl || currentEnterprise.photoURL;
        faviconElement.href = logoUrl;
        faviconElement.type = "image/png"; // ou image/jpeg dependendo do formato
      } else {
        // Usar favicon personalizado de barbearia
        faviconElement.href = "/barbershop-favicon.svg";
        faviconElement.type = "image/svg+xml";
      }
    }

    // Log para debug
    console.log("🔖 Título da página atualizado:", document.title);
    console.log("🖼️ Favicon atualizado:", faviconElement?.href);
  }, [currentEnterprise, loading]);
};
