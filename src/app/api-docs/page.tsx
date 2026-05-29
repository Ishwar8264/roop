/**
 * Purpose: Swagger UI page for Nikharta Roop API documentation
 * Responsibility: Interactive API documentation at /api-docs
 * Important Notes:
 *   - Uses swagger-ui-react for the UI
 *   - Loads spec from /api/api-spec endpoint
 *   - Client component — Swagger UI needs DOM
 */

"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch("/api/api-spec");
        if (!response.ok) {
          throw new Error(`Failed to load API spec: ${response.status}`);
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load API spec");
      } finally {
        setLoading(false);
      }
    }
    loadSpec();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #C2185B",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#757575", fontSize: 16 }}>
            Loading API Documentation...
          </p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 32,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#F44336", marginBottom: 8 }}>Failed to Load API Docs</h2>
          <p style={{ color: "#757575" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) return null;

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        displayRequestDuration={true}
        filter={true}
        persistAuthorization={true}
        tryItOutEnabled={true}
      />
    </div>
  );
}
