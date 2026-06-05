/**
 * Purpose: Landing page — welcome, services preview, CTA
 * Responsibility: First impression — convert visitors to users
 * Important Notes:
 *   - Client component — uses framer-motion animations + auth state + i18n
 *   - Uses PublicHeader (with Sign In/Up buttons) for unauthenticated visitors
 *   - "Book Now" → /login if not authenticated, /dashboard if authenticated
 *   - All text driven by i18n translations
 */

"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Sparkles,
  Scissors,
  Heart,
  Star,
  CalendarCheck,
  Phone,
  ArrowRight,
  Flower2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { PublicHeader } from "@/features/shell/components/public-header";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export function WelcomeClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // When user prefers reduced motion, disable all framer-motion animations
  // framer-motion auto-skips when useReducedMotion returns true,
  // but we also use this to conditionally render simpler elements
  const motionProps = prefersReducedMotion
    ? { initial: false, animate: false }
    : {};

  const handleBookNow = () => {
    router.push(isAuthenticated ? "/dashboard" : "/login");
  };

  const services = [
    {
      icon: <Scissors className="h-8 w-8" />,
      title: t("services.hairCutting"),
      desc: t("services.hairCuttingDesc"),
      price: "₹200+",
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: t("services.facial"),
      desc: t("services.facialDesc"),
      price: "₹500+",
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: t("services.bridalMakeup"),
      desc: t("services.bridalMakeupDesc"),
      price: "₹5,000+",
    },
    {
      icon: <Flower2 className="h-8 w-8" />,
      title: t("services.mehendi"),
      desc: t("services.mehendiDesc"),
      price: "₹300+",
    },
  ];

  const features = [
    {
      icon: <CalendarCheck className="h-6 w-6" />,
      title: t("landing.onlineBooking"),
      desc: t("landing.onlineBookingDesc"),
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: t("landing.otpLogin"),
      desc: t("landing.otpLoginDesc"),
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: t("landing.reviewsRatings"),
      desc: t("landing.reviewsRatingsDesc"),
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: t("landing.offersDiscounts"),
      desc: t("landing.offersDiscountsDesc"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== PUBLIC NAVBAR ===== */}
      <PublicHeader />

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-950/20 dark:via-background dark:to-pink-950/20" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        {/* Floating decorations — hidden when user prefers reduced motion */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute top-20 left-10 text-primary/20"
              animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flower2 className="h-12 w-12" />
            </motion.div>
            <motion.div
              className="absolute top-40 right-16 text-accent/30"
              animate={{ y: [10, -10, 10], rotate: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-10 w-10" />
            </motion.div>
            <motion.div
              className="absolute bottom-20 left-20 text-primary/15"
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="h-8 w-8" />
            </motion.div>
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              {...motionProps}
              className="mb-6"
            >
              <Image
                src="/logo.png"
                alt="Nikharta Roop"
                width={112}
                height={112}
                className="h-24 w-24 sm:h-28 sm:w-28 mx-auto rounded-2xl object-contain shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 mb-6"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              {...motionProps}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              {t("appNameHi").split(" ")[0]}
              <span className="text-primary"> {t("appNameHi").split(" ")[1] || ""}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              {...motionProps}
              className="text-lg sm:text-xl text-muted-foreground mb-4"
            >
              Nikharta Roop
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              {...motionProps}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
            >
              {t("appTagline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8 }}
              {...motionProps}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25"
                onClick={handleBookNow}
              >
                {t("landing.bookNow")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => router.push("/services")}
              >
                {t("landing.viewServices")}
              </Button>
              {!isAuthenticated && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="px-8 py-6 text-lg rounded-xl text-primary"
                  onClick={() => router.push("/login")}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  {t("landing.loginBtn")}
                </Button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              {...motionProps}
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{t("landing.rating")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-primary" />
                <span>{t("landing.happyCustomers")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-green-500" />
                <span>{t("landing.bookings")}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES PREVIEW ===== */}
      <section id="services" className="py-16 sm:py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            {...motionProps}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp} custom={0} {...motionProps}>
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                {t("landing.ourServices")}
              </span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              {...motionProps}
              className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
            >
              {t("landing.everyShade")}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              custom={2}
              {...motionProps}
              className="text-muted-foreground max-w-md mx-auto"
            >
              {t("landing.professionalBeauticians")}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            {...motionProps}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {services.map((service, i) => (
              <motion.div key={service.title} variants={fadeInUp} custom={i} {...motionProps}>
                <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30 rounded-xl overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      {service.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {service.desc}
                    </p>
                    <span className="text-primary font-bold">
                      {service.price}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-16 sm:py-20 bg-gradient-to-b from-rose-50/50 to-background dark:from-rose-950/10 dark:to-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            {...motionProps}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp} custom={0} {...motionProps}>
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                {t("landing.whyChooseUs")}
              </span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              {...motionProps}
              className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
            >
              {t("landing.easyFastReliable")}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            {...motionProps}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeInUp} custom={i} {...motionProps}>
                <div className="text-center p-6 rounded-xl hover:bg-card hover:shadow-md transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== OFFER BANNER ===== */}
      <section id="offer" className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            {...motionProps}
          >
            <div className="bg-gradient-to-r from-primary to-rose-700 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                  {t("landing.specialOffer")}
                </h3>
                <p className="text-white/90 mb-6 max-w-lg mx-auto">
                  {t("landing.firstBookingDiscount")}
                  <span className="font-bold text-yellow-200 ml-1">
                    NR20FIRST
                  </span>
                </p>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-xl font-bold"
                  onClick={handleBookNow}
                >
                  {t("landing.bookNow")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto bg-foreground text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Image
            src="/logo.png"
            alt="Nikharta Roop"
            width={48}
            height={48}
            className="h-12 w-12 mx-auto rounded-xl object-contain mb-3"
          />
          <h3 className="text-xl font-bold text-white mb-2">
            {t("appNameHi")}
          </h3>
          <p className="text-sm mb-4">
            {t("appTagline")}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-white/60 mb-4">
            <button type="button" onClick={() => router.push("/services")} className="hover:text-white transition-colors">{t("nav.services")}</button>
            <span>•</span>
            <button type="button" onClick={() => router.push("/bookings")} className="hover:text-white transition-colors">{t("nav.bookings")}</button>
            <span>•</span>
            <button type="button" onClick={() => router.push("/offers")} className="hover:text-white transition-colors">{t("nav.offers")}</button>
            <span>•</span>
            <button type="button" onClick={() => router.push("/login")} className="hover:text-white transition-colors">{t("auth.login")}</button>
          </div>
          <p className="text-xs text-white/40">
            {t("landing.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
