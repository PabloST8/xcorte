import React, { useEffect } from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { appBootstrap } from "../utils/appBootstrap";

const TempDebug = () => {
  const { enterprises, currentEnterprise, loading, error } = useEnterprise();

  useEffect(() => {
    const debugInfo = {
      bootstrapInitialized: appBootstrap.isInitialized(),
      bootstrapEnterprises: appBootstrap.getEnterprises(),
      bootstrapCurrent: appBootstrap.getCurrentEnterprise(),
      contextEnterprises: enterprises,
      contextCurrent: currentEnterprise,
      contextLoading: loading,
      contextError: error,
    };
    
    console.log("🔍 Debug Info:", debugInfo);
  }, [enterprises, currentEnterprise, loading, error]);

  return (
    <div className="fixed top-4 left-4 bg-black text-white p-4 rounded text-xs max-w-md z-50 max-h-96 overflow-auto">
      <div className="font-bold mb-2">Debug Info</div>
      <div>Bootstrap Init: {appBootstrap.isInitialized() ? "✅" : "❌"}</div>
      <div>Bootstrap Enterprises: {appBootstrap.getEnterprises().length}</div>
      <div>Context Enterprises: {enterprises?.length || 0}</div>
      <div>Current Enterprise: {currentEnterprise?.name || "none"}</div>
      <div>Loading: {loading ? "yes" : "no"}</div>
      <div>Error: {error || "none"}</div>
    </div>
  );
};

export default TempDebug;
