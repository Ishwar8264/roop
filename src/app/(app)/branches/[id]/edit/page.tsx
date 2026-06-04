/**
 * Purpose: Edit branch page
 * Responsibility: Server wrapper — fetches branch data, passes to client form
 */

import { EditBranchPage } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBranchPageWrapper({ params }: PageProps) {
  const { id } = await params;
  return <EditBranchPage branchId={id} />;
}
