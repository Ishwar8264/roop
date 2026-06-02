/**
 * Purpose: Root layout for the entire application
 * Responsibility: Provide fonts, metadata, ThemeProvider, AuthProvider, and Toaster
 * Important Notes:
 *   - Server component — only wraps children, no client logic
 *   - ThemeProvider wraps AuthProvider for theme context
 *   - AuthProvider handles: auth init, QueryClientProvider, loading state
 *   - Toaster at root level for global toast notifications
 *   - Default lang="en" — language switching is client-side via Zustand
 *   - suppressHydrationWarning required for next-themes
 */

import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/features/shell/components/theme-provider";
import { AuthProvider } from "@/features/auth/components/auth-provider";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-hindi",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nikharta Roop | Beauty Parlour",
  description:
    "India's most trusted beauty parlour. Book now — Facial, Bridal Makeup, Hair Cutting and more.",
  keywords: [
    "beauty parlour",
    "bridal makeup",
    "facial",
    "booking",
    "Nikharta Roop",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${notoSansDevanagari.variable} ${inter.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
