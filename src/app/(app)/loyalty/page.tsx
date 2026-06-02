import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Loyalty Points — Nikharta Roop",
  description: "Check your loyalty points and redeem rewards",
};

export default function LoyaltyPage() {
  return <ComingSoon title="Loyalty Points" />;
}
