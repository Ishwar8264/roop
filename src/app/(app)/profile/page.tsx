/**
 * Purpose: Profile page — server component
 * Responsibility: Set metadata and render ProfileClient
 * Important Notes:
 *   - Server component — no hooks, no state
 *   - Metadata: title "Profile — Nikharta Roop"
 */

import type { Metadata } from "next";
import { ProfileClient } from "./client";

export const metadata: Metadata = {
  title: "Profile — Nikharta Roop",
  description: "Manage your profile and account settings",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
