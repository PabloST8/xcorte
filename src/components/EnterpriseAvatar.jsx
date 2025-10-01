import React from "react";

/**
 * Componente para exibir avatar/foto da empresa
 * @param {Object} props
 * @param {Object} props.enterprise - Dados da empresa
 * @param {string} props.size - Tamanho do avatar ('sm', 'md', 'lg', 'xl')
 * @param {string} props.className - Classes CSS adicionais
 */
export default function EnterpriseAvatar({
  enterprise,
  size = "md",
  className = "",
}) {
  // Debug detalhado para ver o que está chegando
  React.useEffect(() => {
    if (enterprise) {
      console.log("🔍 EnterpriseAvatar - Dados recebidos:", {
        enterpriseName: enterprise?.name,
        enterpriseId: enterprise?.id,
        hasPhoto: !!enterprise?.photoURL,
        photoURL: enterprise?.photoURL,
        fullEnterprise: enterprise,
      });
    }
  }, [enterprise]);

  if (!enterprise) {
    return (
      <div
        className={`rounded-full bg-gray-300 flex items-center justify-center ${getSizeClasses(
          size
        )} ${className}`}
      >
        <span className={`font-bold text-gray-500 ${getTextSizeClasses(size)}`}>
          ?
        </span>
      </div>
    );
  }

  const hasPhoto = enterprise.photoURL;
  const firstLetter = enterprise.name?.[0]?.toUpperCase() || "?";

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center border-2 border-amber-400 ${getSizeClasses(
        size
      )} ${className}`}
    >
      {hasPhoto ? (
        <img
          src={enterprise.photoURL}
          alt={enterprise.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback para letra se a imagem falhar
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : (
        <div className="w-full h-full bg-amber-100 flex items-center justify-center">
          <span
            className={`font-bold text-amber-600 ${getTextSizeClasses(size)}`}
          >
            {firstLetter}
          </span>
        </div>
      )}

      {/* Fallback escondido que aparece se a imagem falhar */}
      {hasPhoto && (
        <div
          className="w-full h-full bg-amber-100 flex items-center justify-center"
          style={{ display: "none" }}
        >
          <span
            className={`font-bold text-amber-600 ${getTextSizeClasses(size)}`}
          >
            {firstLetter}
          </span>
        </div>
      )}
    </div>
  );
}

// Utilitários para tamanhos
function getSizeClasses(size) {
  switch (size) {
    case "sm":
      return "w-8 h-8";
    case "md":
      return "w-12 h-12";
    case "lg":
      return "w-16 h-16";
    case "xl":
      return "w-24 h-24";
    default:
      return "w-12 h-12";
  }
}

function getTextSizeClasses(size) {
  switch (size) {
    case "sm":
      return "text-sm";
    case "md":
      return "text-lg";
    case "lg":
      return "text-2xl";
    case "xl":
      return "text-4xl";
    default:
      return "text-lg";
  }
}
