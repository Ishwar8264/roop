/**
 * Purpose: API Documentation page for Nikharta Roop
 * Responsibility: Render OpenAPI spec as an interactive HTML page using CDN-only Swagger UI
 * Important Notes:
 *   - No npm dependencies — pure HTML + CDN script injection
 *   - Loads spec from /api/api-spec endpoint
 *   - Uses metadata export for Next.js (no client component issues)
 */

export const metadata = {
  title: "API Docs — निखरता रूप",
  description: "Nikharta Roop API Documentation — Interactive Swagger UI",
};

export default function ApiDocsPage() {
  return (
    <iframe
      src="/api-docs-iframe"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        display: "block",
      }}
      title="Nikharta Roop API Documentation"
    />
  );
}
