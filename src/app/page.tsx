/**
 * Purpose: Landing route
 * Responsibility: Define landing page metadata and render the interactive landing client
 * Important Notes:
 *   - Server component wrapper keeps metadata out of client code
 */

import type { Metadata } from "next";
import { WelcomeClient } from "./client";

export const metadata: Metadata = {
  title: "Nikharta Roop",
  description: "Book beauty services, view offers, and manage appointments with Nikharta Roop.",
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
