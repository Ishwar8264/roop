/**
 * Purpose: Admin Coming Soon page component
 * Responsibility: Display a styled "Coming Soon" for admin features not yet wired
 * Important Notes:
 *   - Reusable — receives feature title and description
 *   - Shows feature icon and description
 *   - Links back to admin dashboard
 */

"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";

interface AdminComingSoonProps {
  title: string;
  description?: string;
}

export function AdminComingSoon({ title, description }: AdminComingSoonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const animateProps = prefersReducedMotion ? { initial: false, animate: false } : {};

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        {...animateProps}
        className="mb-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
          <Construction className="h-10 w-10" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        {...animateProps}
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {t("comingSoon.title")}
        </h2>
        {description && (
          <p className="text-muted-foreground max-w-md mb-4">{description}</p>
        )}
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {t("comingSoon.subtitle")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        {...animateProps}
      >
        <Button
          onClick={() => router.push("/admin/dashboard")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("admin.backToDashboard")}
        </Button>
      </motion.div>
    </div>
  );
}
