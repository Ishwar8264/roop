/**
 * Purpose: Branch detail page
 * Responsibility: Load one branch and render its detail client component
 * Important Notes:
 *   - Server component for route params, metadata, and not-found handling
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BranchDetailClient } from "./client";
import { getBranchById } from "@/features/branch/services/branch-service";
import { BranchNotFoundError } from "@/lib/server/errors";
import type { BranchDetailResponse } from "@/features/branch/types";

export const metadata: Metadata = {
  title: "Branch Details — Nikharta Roop",
  description: "View branch details and manage holidays",
};

export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let branch: BranchDetailResponse | null = null;
  try {
    branch = await getBranchById(id);
  } catch (error: unknown) {
    if (!(error instanceof BranchNotFoundError)) {
      throw error;
    }
  }

  if (!branch) {
    notFound();
  }

  return <BranchDetailClient initialBranch={branch} />;
}
