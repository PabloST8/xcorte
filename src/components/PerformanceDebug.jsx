import React, { useEffect, useState } from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";

const PerformanceDebug = () => {
  const [logs, setLogs] = useState([]);
  const { enterprises, currentEnterprise, loading } = useEnterprise();

  useEffect(() => {
    const addLog = (message) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `${timestamp}: ${message}`]);
    };

    addLog(
      `Loading: ${loading}, Enterprises: ${
        enterprises?.length || 0
      }, Current: ${currentEnterprise?.name || "none"}`
    );
  }, [loading, enterprises, currentEnterprise]);

  // Só mostra em desenvolvimento
  if (import.meta.env.DEV === false) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs max-w-sm max-h-40 overflow-y-auto">
      <div className="font-bold mb-1">Debug Loading</div>
      {logs.slice(-5).map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
};

export default PerformanceDebug;
