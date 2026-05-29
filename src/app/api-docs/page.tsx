/**
 * Nikharta Roop — Swagger UI Page (Static HTML)
 * Purpose: Interactive API documentation at /api-docs
 * Route: GET /api-docs
 * 
 * Uses unpkg CDN for Swagger UI — no React dependency, no build issues.
 */

export default function ApiDocsPage() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
        <!DOCTYPE html>
        <html lang="hi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>निखरता रूप — API Documentation</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
          <style>
            body { margin: 0; background: #fafafa; }
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info .title { font-size: 28px; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            SwaggerUIBundle({
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
              tryItOutEnabled: true,
              requestInterceptor: function(request) {
                request.headers['X-Requested-With'] = 'NikhartaRoop-SwaggerUI';
                return request;
              }
            });
          </script>
        </body>
        </html>
        `,
      }}
    />
  );
}
