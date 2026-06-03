/**
 * Purpose: Settings page — server component
 * Responsibility: Set metadata and render SettingsClient
 * Important Notes:
 *   - Server component — no hooks, no state
 *   - Metadata: title "Settings — Nikharta Roop"
 */

import type { Metadata } from "next";
import { SettingsClient } from "./client";

export const metadata: Metadata = {
  title: "Settings — Nikharta Roop",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
