import type { Metadata } from "next";
import { StaffDetailClient } from "./client";

export const metadata: Metadata = {
  title: "Staff Detail — Nikharta Roop",
  description: "Staff member details and management",
};

export default function StaffDetailPage() {
  return <StaffDetailClient />;
}
