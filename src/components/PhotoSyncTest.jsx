// Teste para verificar sincronização de fotos de empresas
// Mostra logs detalhados e permite testar upload

import React, { useState, useEffect } from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { enterprisePhotoServiceNoAuth } from "../services/enterprisePhotoServiceNoAuth";
import { enterprisePhotoSyncService } from "../services/enterprisePhotoSyncService";

export default function PhotoSyncTest() {
  const { currentEnterprise } = useEnterprise();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    console.log("🧪 PhotoSyncTest - Empresa atual:", {
      name: currentEnterprise?.name,
      id: currentEnterprise?.id,
      email: currentEnterprise?.email,
      hasPhoto: !!currentEnterprise?.photoURL,
      photoURL: currentEnterprise?.photoURL,
    });
  }, [currentEnterprise]);

  const testPhotoSync = async () => {
    const enterpriseId = currentEnterprise?.id || currentEnterprise?.email;
    if (!enterpriseId) {
      alert("Nenhuma empresa selecionada - id e email são undefined");
      return;
    }

    try {
      console.log("🧪 Testando sincronização de foto para:", enterpriseId);

      // Buscar foto atual do Firestore
      const photoData =
        await enterprisePhotoSyncService.getCurrentPhotoFromFirestore(
          enterpriseId
        );

      console.log("📸 Foto encontrada no Firestore:", photoData);

      setLastUpdate(new Date().toLocaleTimeString());

      if (photoData.photoURL) {
        alert(`Foto encontrada: ${photoData.photoURL.substring(0, 50)}...`);
      } else {
        alert("Nenhuma foto encontrada no Firestore");
      }
    } catch (error) {
      console.error("❌ Erro ao testar sincronização:", error);
      alert("Erro: " + error.message);
    }
  };

  const testPhotoUpload = async () => {
    const enterpriseId = currentEnterprise?.id || currentEnterprise?.email;
    if (!enterpriseId) {
      alert("Nenhuma empresa selecionada - id e email são undefined");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setUploadingPhoto(true);

      try {
        console.log("🧪 Testando upload de foto para:", enterpriseId);

        const result = await enterprisePhotoServiceNoAuth.uploadPhoto(
          enterpriseId,
          file
        );

        console.log("✅ Upload realizado:", result);
        setLastUpdate(new Date().toLocaleTimeString());

        alert(
          "Upload realizado com sucesso! Verifique se a foto aparece automaticamente."
        );
      } catch (error) {
        console.error("❌ Erro no upload:", error);
        alert("Erro no upload: " + error.message);
      } finally {
        setUploadingPhoto(false);
      }
    };

    input.click();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        backgroundColor: "white",
        border: "2px solid #ccc",
        borderRadius: "8px",
        padding: "15px",
        zIndex: 9999,
        maxWidth: "300px",
        fontSize: "12px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
        🧪 Teste de Fotos
      </h3>

      <div style={{ marginBottom: "10px" }}>
        <strong>Empresa:</strong> {currentEnterprise?.name || "Nenhuma"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>ID:</strong>{" "}
        {currentEnterprise?.id || currentEnterprise?.email || "❌ Nenhum"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Tem Foto:</strong>{" "}
        {currentEnterprise?.photoURL ? "✅ Sim" : "❌ Não"}
      </div>

      {currentEnterprise?.photoURL && (
        <div style={{ marginBottom: "10px" }}>
          <img
            src={currentEnterprise.photoURL}
            alt="Foto da empresa"
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={testPhotoSync}
          style={{ marginRight: "5px", padding: "5px 10px", fontSize: "11px" }}
        >
          🔄 Sincronizar
        </button>

        <button
          onClick={testPhotoUpload}
          disabled={uploadingPhoto}
          style={{ padding: "5px 10px", fontSize: "11px" }}
        >
          {uploadingPhoto ? "⏳ Enviando..." : "📷 Upload"}
        </button>
      </div>

      {lastUpdate && (
        <div style={{ fontSize: "10px", color: "#666" }}>
          Última atualização: {lastUpdate}
        </div>
      )}
    </div>
  );
}
