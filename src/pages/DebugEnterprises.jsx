import React from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { enterpriseCandidates } from "../utils/slug";
import { useParams, useLocation } from "react-router-dom";
import { USE_REMOTE_API, REMOTE_API_BASE_URL, APP_BUILD_INFO } from "../config";

export default function DebugEnterprises() {
  const { enterprises, currentEnterprise } = useEnterprise();
  const { enterpriseSlug } = useParams();
  const location = useLocation();

  return (
    <div className="p-4 max-w-4xl mx-auto text-sm">
      <h1 className="text-xl font-bold mb-2">Debug Enterprises</h1>
      <div className="mb-4 space-y-1 bg-gray-100 p-3 rounded">
        <div>
          <strong>URL Path:</strong> {location.pathname}
        </div>
        <div>
          <strong>Param enterpriseSlug:</strong>{" "}
          {enterpriseSlug || <em>(none)</em>}
        </div>
        <div>
          <strong>Current Enterprise:</strong>{" "}
          {currentEnterprise ? currentEnterprise.name : "(none)"}
        </div>
        <div>
          <strong>USE_REMOTE_API:</strong> {String(USE_REMOTE_API)}
        </div>
        <div>
          <strong>REMOTE_API_BASE_URL:</strong> {REMOTE_API_BASE_URL}
        </div>
        <div>
          <strong>Build Time:</strong> {APP_BUILD_INFO.buildTime}
        </div>
      </div>
      <h2 className="font-semibold mb-2">
        Lista de Empresas ({enterprises.length})
      </h2>
      <div className="space-y-3">
        {enterprises.map((e) => {
          const candidates = enterpriseCandidates(e);
          return (
            <div
              key={e.id || e.email}
              className="border rounded p-2 bg-white shadow-sm"
            >
              <div className="font-medium">{e.name}</div>
              <div className="text-gray-600 text-xs">id: {e.id}</div>
              <div className="text-gray-600 text-xs">email: {e.email}</div>
              <div className="mt-1 text-xs flex flex-wrap gap-1">
                {candidates.map((c) => (
                  <code key={c} className="bg-gray-200 px-1 rounded">
                    {c}
                  </code>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-gray-500">
        Use esta página para validar slugs aceitos e estado do provider.
      </p>
    </div>
  );
}
