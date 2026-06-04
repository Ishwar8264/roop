/**
 * Purpose: Admin — Edit branch page (server component)
 * Responsibility: Unwrap params, render client form component
 */

import { EditBranchClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditBranchPage({ params }: PageProps) {
  const { id } = await params;
  return <EditBranchClient branchId={id} />;
}
