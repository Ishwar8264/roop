import type { Metadata } from "next";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = {
  title: "Profile — Nikharta Roop",
  description: "Manage your profile and account settings",
};

export default function ProfilePage() {
  return <ComingSoon title="Profile" />;
}
