import React from "react";
import { User } from "lucide-react";

/**
 * Componente para exibir avatar/foto de perfil do usuário
 */
const UserAvatar = ({
  photoUrl,
  userName,
  size = "medium",
  className = "",
}) => {
  // Tamanhos disponíveis
  const sizes = {
    small: "w-8 h-8 text-xs",
    medium: "w-12 h-12 text-sm",
    large: "w-16 h-16 text-lg",
    xlarge: "w-24 h-24 text-xl",
  };

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 22,
    xlarge: 28,
  };

  // Obter iniciais do nome
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`relative ${sizes[size]} rounded-full overflow-hidden bg-amber-500 flex items-center justify-center ${className}`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Foto de ${userName || "usuário"}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback para iniciais se a imagem falhar ao carregar
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-amber-500">
          {userName ? (
            <span
              className={`text-white font-bold ${
                sizes[size].includes("text-")
                  ? sizes[size].split(" ").find((c) => c.startsWith("text-"))
                  : "text-sm"
              }`}
            >
              {getInitials(userName)}
            </span>
          ) : (
            <User size={iconSizes[size]} className="text-white" />
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
