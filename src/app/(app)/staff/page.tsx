import type { Metadata } from "next";
import { StaffClient } from "./client";

export const metadata: Metadata = {
  title: "Staff — Nikharta Roop",
  description: "Manage our beauticians and staff members",
};

export default function StaffPage() {
  return <StaffClient />;
}
