/**
 * Purpose: Settings page — server component
 * Responsibility: Set metadata and render SettingsClient
 * Important Notes:
 *   - Re-uses the SettingsClient from /profile/settings
 *   - This is the entry point for the bottom nav "Settings" tab
 */

import type { Metadata } from "next";
import { SettingsClient } from "../profile/settings/client";

export const metadata: Metadata = {
  title: "Settings — Nikharta Roop",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
