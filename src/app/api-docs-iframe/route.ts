/**
 * Purpose: Serve Swagger UI as raw HTML (no React/JSX dependency)
 * Responsibility: Return a complete HTML page with Swagger UI loaded via CDN
 * Important Notes:
 *   - This is a Route Handler that returns raw HTML, NOT a React page
 *   - Avoids all npm swagger packages (compatibility issues with React 19 + Turbopack)
 *   - Swagger UI JS + CSS loaded from unpkg CDN
 *   - Spec fetched from /api/api-spec
 */

import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nikharta Roop API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.18.3/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: auto; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    /* Deep Rose Pink theme overrides */
    .swagger-ui .topbar { background-color: #C2185B; }
    .swagger-ui .topbar .download-url-wrapper .download-url-button { background: #880E4F; }
    .swagger-ui .info .title { color: #C2185B; }
    .swagger-ui .opblock-tag { color: #C2185B; }
    .swagger-ui .btn.execute { background-color: #C2185B; border-color: #C2185B; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.3/swagger-ui-bundle.js"></script>
  <script>
    const ui = SwaggerUIBundle({
      url: "/api/api-spec",
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout",
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      filter: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
