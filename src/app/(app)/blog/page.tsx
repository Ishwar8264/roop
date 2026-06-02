import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Blog — Nikharta Roop",
  description: "Beauty tips, trends, and inspiration",
};

export default function BlogPage() {
  return <ComingSoon title="Blog" />;
}
