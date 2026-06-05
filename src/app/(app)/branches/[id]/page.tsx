import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BranchDetailClient } from "./client";
import { getBranchById } from "@/features/branch/services/branch-service";
import type { BranchDetailResponse } from "@/features/branch/types";

export const metadata: Metadata = {
  title: "Branch Details — Nikharta Roop",
  description: "View branch details and manage holidays",
};

export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let branch: BranchDetailResponse;
  try {
    branch = await getBranchById(id);
  } catch {
    notFound();
  }

  return <BranchDetailClient initialBranch={branch} />;
}
