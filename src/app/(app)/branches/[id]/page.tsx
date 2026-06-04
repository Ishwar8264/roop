import type { Metadata } from "next";
import { BranchDetailClient } from "./client";

export const metadata: Metadata = {
  title: "Branch Details — Nikharta Roop",
  description: "View branch details and manage holidays",
};

export default function BranchDetailPage() {
  return <BranchDetailClient />;
}
