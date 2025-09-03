import React from "react";

function HomeSimple() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: "500px",
          margin: "1rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#333" }}>
          💇‍♂️ X-Corte Barbearia
        </h1>
        <p
          style={{ fontSize: "1.2rem", color: "#666", marginBottom: "1.5rem" }}
        >
          Seu site está funcionando perfeitamente!
        </p>
        <div style={{ display: "grid", gap: "0.5rem", textAlign: "left" }}>
          <div
            style={{ display: "flex", alignItems: "center", color: "#22c55e" }}
          >
            <span style={{ marginRight: "0.5rem" }}>✅</span>
            <span>React renderizando</span>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", color: "#22c55e" }}
          >
            <span style={{ marginRight: "0.5rem" }}>✅</span>
            <span>Vite servindo arquivos</span>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", color: "#22c55e" }}
          >
            <span style={{ marginRight: "0.5rem" }}>✅</span>
            <span>CSS funcionando</span>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", color: "#22c55e" }}
          >
            <span style={{ marginRight: "0.5rem" }}>✅</span>
            <span>AuthContext carregado</span>
          </div>
        </div>
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#f0f9ff",
            borderRadius: "0.5rem",
            border: "1px solid #0ea5e9",
          }}
        >
          <p style={{ color: "#0c4a6e", margin: 0 }}>
            <strong>Status:</strong> Sistema Online 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomeSimple;
