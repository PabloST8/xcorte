import { auth } from "../services/firebase";
import { signInAnonymously } from "firebase/auth";

/**
 * Componente para testar e configurar autenticação anônima
 */
const AuthTest = () => {
  const testAnonymousAuth = async () => {
    try {
      console.log("🧪 Testando autenticação anônima...");
      const result = await signInAnonymously(auth);
      console.log("✅ Autenticação anônima funcionando!", result.user.uid);
      alert("✅ Autenticação anônima funcionando!");
    } catch (error) {
      console.error("❌ Erro na autenticação anônima:", error);

      if (error.code === "auth/operation-not-allowed") {
        alert(
          '❌ Autenticação anônima não está habilitada no Firebase Console.\n\nPara habilitar:\n1. Acesse https://console.firebase.google.com/project/xcortes-e6f64/authentication/providers\n2. Clique em "Anonymous"\n3. Ative a opção "Enable"'
        );
      } else {
        alert(`❌ Erro: ${error.message}`);
      }
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-semibold text-yellow-800 mb-2">
        🔐 Teste de Autenticação
      </h4>
      <p className="text-sm text-yellow-700 mb-3">
        Para o upload funcionar, a autenticação anônima deve estar habilitada.
      </p>
      <button
        onClick={testAnonymousAuth}
        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
      >
        Testar Autenticação Anônima
      </button>
    </div>
  );
};

export default AuthTest;
