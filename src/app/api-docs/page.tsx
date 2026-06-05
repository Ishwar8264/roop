/**
 * Purpose: API docs route
 * Responsibility: Define API docs metadata and render the interactive docs client
 * Important Notes:
 *   - Server component wrapper keeps metadata out of client code
 */

import type { Metadata } from "next";
import { openApiSpec } from "@/lib/swagger";
import { ApiDocsClient, type ApiSpec } from "./client";

export const metadata: Metadata = {
  title: "API Docs | Nikharta Roop",
  description: "Interactive OpenAPI documentation for Nikharta Roop API routes.",
};

export default function ApiDocsPage() {
  return <ApiDocsClient initialSpec={openApiSpec as unknown as ApiSpec} />;
}
