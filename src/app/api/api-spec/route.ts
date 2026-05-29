/**
 * Nikharta Roop — OpenAPI JSON Endpoint
 * Purpose: Serve the OpenAPI 3.0.3 spec as JSON
 * Route: GET /api/api-spec
 */

import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/swagger";

export async function GET() {
  return NextResponse.json(openApiSpec);
}
