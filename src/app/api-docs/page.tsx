"use client";

/**
 * Nikharta Roop — Swagger UI Page
 * Purpose: Interactive API documentation at /api-docs
 * Route: GET /api-docs
 *
 * Uses CDN-loaded Swagger UI via useEffect — no SSR issues.
 */

import { useEffect, useRef } from "react";

// Declare global for SwaggerUIBundle
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var SwaggerUIBundle: any;
}

export default function ApiDocsPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Helper to load a script and return a promise
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        // Check if already loaded
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

    // Helper to load a stylesheet
    const loadStyle = (href: string) => {
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };

    const initSwagger = async () => {
      try {
        // 1. Load CSS
        loadStyle(
          "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
        );

        // 2. Load Swagger UI Bundle JS
        await loadScript(
          "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        );

        // 3. Initialize Swagger UI
        if (window.SwaggerUIBundle) {
          window.SwaggerUIBundle({
            url: "/api/api-spec",
            dom_id: "#swagger-ui",
            presets: [
              window.SwaggerUIBundle.presets.apis,
              window.SwaggerUIBundle.SwaggerUIStandalonePreset,
            ],
            layout: "BaseLayout",
            docExpansion: "list",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            tryItOutEnabled: true,
            requestInterceptor: (request: RequestInit) => {
              const headers = new Headers(request.headers);
              headers.set("X-Requested-With", "NikhartaRoop-SwaggerUI");
              return { ...request, headers };
            },
          });
        }
      } catch (err) {
        console.error("Failed to initialize Swagger UI:", err);
        const container = document.getElementById("swagger-ui");
        if (container) {
          container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #C2185B;">
              <h2>Swagger UI Load Failed</h2>
              <p>CDN से Swagger UI load नहीं हो पाया। Internet connection check करें।</p>
              <p style="color: #666; font-size: 14px;">
                API Spec directly देखें: <a href="/api/api-spec" style="color: #C2185B;">/api/api-spec</a>
              </p>
            </div>
          `;
        }
      }
    };

    initSwagger();
  }, []);

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <style>{`
        /* Hide default Swagger topbar */
        .swagger-ui .topbar { display: none; }
        /* Title styling */
        .swagger-ui .info .title { font-size: 28px; }
        /* Loading state */
        #swagger-ui-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
          font-family: 'Noto Sans Devanagari', sans-serif;
          color: #C2185B;
          font-size: 18px;
        }
      `}</style>
      <div id="swagger-ui">
        <div id="swagger-ui-loading">
          <p>Loading API Documentation...</p>
        </div>
      </div>
    </div>
  );
}
