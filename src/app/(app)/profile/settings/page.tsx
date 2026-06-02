import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Settings — Nikharta Roop",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return <ComingSoon title="Settings" />;
}
