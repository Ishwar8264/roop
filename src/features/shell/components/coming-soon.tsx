/**
 * Purpose: Coming Soon page component
 * Responsibility: Display a beautiful "Coming Soon" placeholder for pages under development
 * Important Notes:
 *   - Reusable — receives page title as prop
 *   - Animated with framer-motion
 *   - Links back to dashboard
 *   - i18n-aware
 */

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";

interface ComingSoonProps {
  title?: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-6"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary">
          <Construction className="h-12 w-12" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {title && (
          <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        )}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t("comingSoon.title")}
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          {t("comingSoon.subtitle")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("comingSoon.goBack")}
        </Button>
      </motion.div>
    </div>
  );
}
