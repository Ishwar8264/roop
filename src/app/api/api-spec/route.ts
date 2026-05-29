/**
 * Purpose: Serve OpenAPI 3.0 specification as JSON
 * Responsibility: Returns the full API spec for Swagger UI consumption
 * Endpoint: GET /api/api-spec
 */

import { NextResponse } from "next/server";
import { getApiSpecJson } from "@/lib/swagger";

export async function GET() {
  return new NextResponse(getApiSpecJson(), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
