import React from "react";

const LoadingSpinner = ({
  size = "medium",
  message = "Carregando...",
  fullScreen = false,
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const containerClasses = fullScreen
    ? "min-h-screen bg-gray-50 flex items-center justify-center"
    : "flex items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-2 ${sizeClasses[size]}`}
        ></div>
        {message && <p className="text-gray-600 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
