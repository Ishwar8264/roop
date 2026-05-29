import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  title: "निखरता रूप — Nikharta Roop | Beauty Parlour",
  description:
    "भारत का सबसे भरोसेमंद ब्यूटी पार्लर। अभी बुक करें — फेशियल, ब्राइडल मेकअप, हेयर कटिंग और भी बहुत कुछ।",
  keywords: [
    "beauty parlour",
    "ब्यूटी पार्लर",
    "bridal makeup",
    "facial",
    "booking",
    "निखरता रूप",
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
    <html lang="hi" suppressHydrationWarning>
      <body
        className={`${notoSansDevanagari.variable} ${inter.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
