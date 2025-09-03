import React from "react";

function HomeTest() {
  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        🏠 Teste da Página Home
      </h1>
      <p className="text-lg text-gray-700">
        Se você está vendo esta mensagem, o React está funcionando corretamente!
      </p>
      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <p className="text-blue-800">
          ✅ Vite está servindo os arquivos
          <br />
          ✅ React está renderizando
          <br />✅ Tailwind CSS está funcionando
        </p>
      </div>
    </div>
  );
}

export default HomeTest;
