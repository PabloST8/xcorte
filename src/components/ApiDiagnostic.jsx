import React, { useState } from "react";
import Cookies from "js-cookie";

/**
 * Componente para testar e diagnosticar problemas da API em produção
 */
const ApiDiagnostic = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const API_BASE = "https://x-corte-api.codxis.com.br/api";

  const getHeaders = () => {
    const token = Cookies.get("auth_token");
    const userData = Cookies.get("user_data");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.id) headers["X-User-ID"] = user.id;
        if (user.phone) headers["X-User-Phone"] = user.phone;
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }

    return headers;
  };

  const testEndpoint = async (name, url, options = {}) => {
    setLoading((prev) => ({ ...prev, [name]: true }));

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: getHeaders(),
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      setResults((prev) => ({
        ...prev,
        [name]: {
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          status: "ERROR",
          success: false,
          error: error.message,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }));
    }
  };

  const tests = [
    {
      name: "health",
      label: "Health Check",
      url: `${API_BASE}/health`,
    },
    {
      name: "bookings",
      label: "Get Bookings",
      url: `${API_BASE}/bookings?enterpriseEmail=barbeariamikael@gmail.com`,
    },
    {
      name: "employees",
      label: "Get Employees",
      url: `${API_BASE}/employees?enterpriseEmail=barbeariamikael@gmail.com&isActive=true`,
    },
    {
      name: "availabilityService",
      label: "Employee Availability (Service)",
      url: `${API_BASE}/employees/availability/service?enterpriseEmail=barbeariamikael@gmail.com&productId=gGHkVOUgSLDhTIJaFQlq&date=2025-10-03&startTime=16:30`,
    },
    {
      name: "createBooking",
      label: "Create Booking (POST)",
      url: `${API_BASE}/bookings?enterpriseEmail=barbeariamikael@gmail.com`,
      method: "POST",
      body: {
        clientName: "Test Client",
        clientPhone: "88994464373",
        productId: "gGHkVOUgSLDhTIJaFQlq",
        employeeId: "mikael@gmail.com",
        date: "2025-10-04",
        startTime: "10:00",
        notes: "teste diagnóstico",
      },
    },
  ];

  const runAllTests = () => {
    tests.forEach((test) => {
      testEndpoint(test.name, test.url, {
        method: test.method,
        body: test.body,
      });
    });
  };

  const currentAuth = () => {
    const token = Cookies.get("auth_token");
    const userData = Cookies.get("user_data");

    return {
      hasToken: !!token,
      tokenType: token
        ? token.startsWith("simple-")
          ? "simple"
          : "real"
        : "none",
      tokenPreview: token ? token.substring(0, 30) + "..." : null,
      hasUserData: !!userData,
      userData: userData ? JSON.parse(userData) : null,
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">API Diagnostic Tool</h1>

      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <pre className="text-sm bg-white p-3 rounded border overflow-auto">
          {JSON.stringify(currentAuth(), null, 2)}
        </pre>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Run All Tests
        </button>
      </div>

      {/* Individual Tests */}
      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{test.label}</h3>
              <button
                onClick={() =>
                  testEndpoint(test.name, test.url, {
                    method: test.method,
                    body: test.body,
                  })
                }
                disabled={loading[test.name]}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {loading[test.name] ? "Testing..." : "Test"}
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              <strong>{test.method || "GET"}</strong> {test.url}
            </div>

            {test.body && (
              <div className="text-sm mb-2">
                <strong>Body:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
                  {JSON.stringify(test.body, null, 2)}
                </pre>
              </div>
            )}

            {results[test.name] && (
              <div className="mt-3">
                <div
                  className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    results[test.name].success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {results[test.name].status} {results[test.name].statusText}
                </div>

                <pre className="bg-gray-50 p-3 rounded mt-2 text-xs overflow-auto max-h-60">
                  {JSON.stringify(results[test.name], null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiDiagnostic;
