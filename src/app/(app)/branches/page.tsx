import type { Metadata } from "next";
import { BranchesClient } from "./client";
import { listBranches } from "@/features/branch/services/branch-service";
import type { BranchListResponse } from "@/features/branch/types";

export const metadata: Metadata = {
  title: "Branches — Nikharta Roop",
  description: "Manage our parlour branches and locations",
};

export default async function BranchesPage() {
  // Server-side fetch — default page load with active branches
  const initialData: BranchListResponse = await listBranches({
    includeInactive: false,
    page: 1,
    limit: 20,
  });

  return <BranchesClient initialData={initialData} />;
}
