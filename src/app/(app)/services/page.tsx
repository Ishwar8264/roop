import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Services — Nikharta Roop",
  description: "Browse our beauty services — Hair, Facial, Bridal, Mehendi & more",
};

export default function ServicesPage() {
  return <ComingSoon title="Services" />;
}
