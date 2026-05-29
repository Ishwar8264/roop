import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
