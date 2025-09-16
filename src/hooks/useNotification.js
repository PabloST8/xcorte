import { useState, useCallback } from "react";

export const useNotification = () => {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showNotification = useCallback(
    (message, type = "success", duration = 4000) => {
      setNotification({
        show: true,
        message,
        type,
        duration,
      });
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  }, []);

  // Funções de conveniência
  const showSuccess = useCallback(
    (message, duration) => showNotification(message, "success", duration),
    [showNotification]
  );
  const showError = useCallback(
    (message, duration) => showNotification(message, "error", duration),
    [showNotification]
  );
  const showWarning = useCallback(
    (message, duration) => showNotification(message, "warning", duration),
    [showNotification]
  );
  const showInfo = useCallback(
    (message, duration) => showNotification(message, "info", duration),
    [showNotification]
  );

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
