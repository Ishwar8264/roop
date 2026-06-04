import type { Metadata } from "next";
import { BranchesClient } from "./client";

export const metadata: Metadata = {
  title: "Branches — Nikharta Roop",
  description: "Manage our parlour branches and locations",
};

export default function BranchesPage() {
  return <BranchesClient />;
}
