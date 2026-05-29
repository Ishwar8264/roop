"use client";

/**
 * Nikharta Roop — API Documentation Page (Scalar)
 * Purpose: Interactive API documentation at /api-docs
 * Route: GET /api-docs
 *
 * Uses @scalar/api-reference web component via dynamic import
 * Avoids React SSR / Next.js 16 proxy adapter issues
 */

import { useEffect, useRef, useState } from "react";

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // 1. Fetch the OpenAPI spec from our own endpoint
        const res = await fetch("/api/api-spec");
        if (!res.ok) throw new Error(`API spec fetch failed: HTTP ${res.status}`);
        const spec = await res.json();

        // 2. Dynamically import Scalar web component
        //    @scalar/api-reference exports a custom element <api-reference>
        await import("@scalar/api-reference-react");

        // 3. Create the web component and attach spec
        if (containerRef.current) {
          // Clear loading placeholder
          containerRef.current.innerHTML = "";

          const el = document.createElement("api-reference");
          el.setAttribute("data-spec", JSON.stringify(spec));
          el.setAttribute("data-theme", "default");
          el.setAttribute("data-layout", "modern");

          containerRef.current.appendChild(el);
          setStatus("ready");
        }
      } catch (err) {
        console.error("Failed to initialize API docs:", err);
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      }
    };

    init();
  }, []);

  if (status === "error") {
    return (
      <div style={errorStyle}>
        <h2 style={{ color: "#C2185B", marginBottom: "12px" }}>
          API Docs Load Failed
        </h2>
        <p style={{ marginBottom: "8px" }}>
          API documentation load नहीं हो पाई। कृपया page refresh करें।
        </p>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
          Error: {errorMsg}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <a
            href="/api/api-spec"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#C2185B",
              textDecoration: "underline",
              padding: "8px 16px",
              border: "1px solid #C2185B",
              borderRadius: "8px",
            }}
          >
            API Spec JSON देखें
          </a>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#C2185B",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Refresh करें
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <style>{`
        /* Scalar overrides for Nikharta Roop branding */
        api-reference {
          --scalar-font: 'Noto Sans Devanagari', 'Inter', sans-serif;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ height: "100%" }}
      >
        {status === "loading" && (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <p style={{ color: "#C2185B", fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: "16px" }}>
              API Documentation load हो रही है...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Styles =====
const loadingStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  gap: "16px",
};

const spinnerStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #C2185B",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const errorStyle: React.CSSProperties = {
  padding: "40px",
  textAlign: "center",
  fontFamily: "'Noto Sans Devanagari', sans-serif",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};
