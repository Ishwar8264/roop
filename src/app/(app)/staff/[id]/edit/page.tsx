/**
 * Purpose: Edit staff page
 * Responsibility: Server wrapper — passes staff ID to client form
 */

import { EditStaffPage } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStaffPageWrapper({ params }: PageProps) {
  const { id } = await params;
  return <EditStaffPage staffId={id} />;
}
