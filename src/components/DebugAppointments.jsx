import React, { useState, useEffect } from "react";
import { enterpriseBookingFirestoreService } from "../services/enterpriseBookingFirestoreService";
import { appointmentService } from "../services/barbershopService";
import { useAuth } from "../hooks/useAuthContext";
import { useEnterprise } from "../contexts/EnterpriseContext";

export default function DebugAppointments() {
  const { user } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const [firestoreData, setFirestoreData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const testFirestore = React.useCallback(async () => {
    if (!currentEnterprise?.email) {
      console.log("❌ Sem enterprise email");
      return;
    }

    setLoading(true);
    console.log("🧪 Testando Firestore diretamente...");

    try {
      // Buscar todos os agendamentos
      const all = await enterpriseBookingFirestoreService.list(
        currentEnterprise.email,
        { date: "all" }
      );

      console.log("🧪 Todos os agendamentos do Firestore:", all);
      setFirestoreData(all || []);
    } catch (error) {
      console.error("❌ Erro ao buscar do Firestore:", error);
    }
  }, [currentEnterprise?.email]);

  const testService = React.useCallback(async () => {
    if (!currentEnterprise?.email || !user) {
      console.log("❌ Sem enterprise email ou user");
      return;
    }

    console.log("🧪 Testando appointmentService diretamente...");

    try {
      const params = {
        enterpriseEmail: currentEnterprise.email,
        clientEmail: user.email,
        clientName: user.name,
        clientPhone: user.phone || user.phoneNumber,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone || user.phoneNumber,
      };

      console.log("🧪 Params para appointmentService:", params);

      const result = await appointmentService.getUserAppointments(params);

      console.log("🧪 Resultado do appointmentService:", result);
      setServiceData(result || []);
    } catch (error) {
      console.error("❌ Erro ao buscar do appointmentService:", error);
    } finally {
      setLoading(false);
    }
  }, [currentEnterprise?.email, user]);

  const testBoth = React.useCallback(async () => {
    setLoading(true);
    await testFirestore();
    await testService();
  }, [testFirestore, testService]);

  useEffect(() => {
    if (currentEnterprise?.email && user) {
      testBoth();
    }
  }, [currentEnterprise?.email, user, testBoth]);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🧪 Debug Agendamentos</h3>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Enterprise:</strong> {currentEnterprise?.email || "N/A"}
        </p>
        <p>
          <strong>User:</strong> {user?.email || user?.name || "N/A"}
        </p>
        <p>
          <strong>Firestore Count:</strong> {firestoreData.length}
        </p>
        <p>
          <strong>Service Count:</strong> {serviceData.length}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={testFirestore}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Testar Firestore
        </button>

        <button
          onClick={testService}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Testar Service
        </button>

        <button
          onClick={testBoth}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Testando..." : "Testar Ambos"}
        </button>
      </div>

      {firestoreData.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">Firestore ({firestoreData.length}):</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(firestoreData.slice(0, 3), null, 2)}
          </pre>
        </div>
      )}

      {serviceData.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">
            AppointmentService ({serviceData.length}):
          </h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(serviceData.slice(0, 3), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
