import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Bookings — Nikharta Roop",
  description: "View and manage your beauty appointments",
};

export default function BookingsPage() {
  return <ComingSoon title="Bookings" />;
}
