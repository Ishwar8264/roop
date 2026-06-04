/**
 * Purpose: Admin — Edit staff page (server component)
 * Responsibility: Unwrap params, render client form component
 */

import { EditStaffClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditStaffPage({ params }: PageProps) {
  const { id } = await params;
  return <EditStaffClient staffId={id} />;
}
