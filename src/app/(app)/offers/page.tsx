import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Offers — Nikharta Roop",
  description: "Exclusive deals and discounts on beauty services",
};

export default function OffersPage() {
  return <ComingSoon title="Offers" />;
}
