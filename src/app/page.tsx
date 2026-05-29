"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Scissors,
  Heart,
  Star,
  CalendarCheck,
  Phone,
  ArrowRight,
  Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const services = [
  {
    icon: <Scissors className="h-8 w-8" />,
    title: "हेयर कटिंग",
    titleEn: "Hair Cutting",
    desc: "ट्रेंडी से लेकर क्लासिक — आपकी पसंद का स्टाइल",
    price: "₹200 से",
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "फेशियल",
    titleEn: "Facial",
    desc: "ग्लोइंग स्किन के लिए प्रोफेशनल फेशियल ट्रीटमेंट",
    price: "₹500 से",
  },
  {
    icon: <Heart className="h-8 w-8" />,
    title: "ब्राइडल मेकअप",
    titleEn: "Bridal Makeup",
    desc: "आपके खास दिन के लिए परफेक्ट लुक",
    price: "₹5,000 से",
  },
  {
    icon: <Flower2 className="h-8 w-8" />,
    title: "मेहंदी",
    titleEn: "Mehendi",
    desc: "सुंदर डिज़ाइन — शादी और त्योहार के लिए",
    price: "₹300 से",
  },
];

const features = [
  {
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "ऑनलाइन बुकिंग",
    desc: "कहीं से भी, कभी भी बुक करें",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "OTP लॉगिन",
    desc: "पासवर्ड नहीं — बस मोबाइल नंबर",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "रिव्यू और रेटिंग",
    desc: "असली कस्टमर रिव्यू पढ़ें",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "ऑफ़र और छूट",
    desc: "त्योहारों पर खास डिस्काउंट",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        {/* Floating decorative elements */}
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

        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="text-center">
            {/* Logo / Brand */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                भारत का भरोसेमंद ब्यूटी पार्लर
              </div>
            </motion.div>

            {/* Hindi Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              निखरता
              <span className="text-primary"> रूप</span>
            </motion.h1>

            {/* English Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="text-lg sm:text-xl text-muted-foreground mb-4"
            >
              Nikharta Roop
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              आपकी खूबसूरती की पूरी देखभाल — एक क्लिक में बुक करें।
              <br />
              फेशियल, ब्राइडल मेकअप, हेयर स्टाइलिंग और भी बहुत कुछ।
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25"
              >
                अभी बुक करें
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-xl border-primary/30 text-primary hover:bg-primary/5"
              >
                सेवाएं देखें
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span>4.8 रेटिंग</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-primary" />
                <span>5,000+ खुश कस्टमर</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-success" />
                <span>10,000+ बुकिंग</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES PREVIEW ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                हमारी सेवाएं
              </span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              आपकी खूबसूरती का हर रंग
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="text-muted-foreground max-w-md mx-auto"
            >
              प्रोफेशनल ब्यूटीशियन — घर जैसा अनुभव
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {services.map((service, i) => (
              <motion.div key={i} variants={fadeInUp} custom={i}>
                <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30 rounded-xl overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      {service.icon}
                    </div>
                    <h3
                      className="text-lg font-semibold text-foreground mb-1"
                      style={{
                        fontFamily: "'Noto Sans Devanagari', sans-serif",
                      }}
                    >
                      {service.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {service.titleEn}
                    </p>
                    <p
                      className="text-sm text-muted-foreground mb-3"
                      style={{
                        fontFamily: "'Noto Sans Devanagari', sans-serif",
                      }}
                    >
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
      <section className="py-16 sm:py-20 bg-gradient-to-b from-rose-50/50 to-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                क्यों चुनें हमें?
              </span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              आसान, तेज़ और भरोसेमंद
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeInUp} custom={i}>
                <div className="text-center p-6 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3
                    className="text-base font-semibold text-foreground mb-2"
                    style={{
                      fontFamily: "'Noto Sans Devanagari', sans-serif",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{
                      fontFamily: "'Noto Sans Devanagari', sans-serif",
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== OFFER BANNER ===== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-primary to-rose-dark rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <h3
                  className="text-2xl sm:text-3xl font-bold mb-3"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                  }}
                >
                  🎉 खास ऑफ़र — सिर्फ आपके लिए!
                </h3>
                <p
                  className="text-white/90 mb-6 max-w-lg mx-auto"
                  style={{
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                  }}
                >
                  पहली बुकिंग पर 20% छूट! कोड:
                  <span className="font-bold text-yellow-200 ml-1">
                    NR20FIRST
                  </span>
                </p>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-xl font-bold"
                >
                  अभी बुक करें
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
          <h3
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          >
            निखरता रूप
          </h3>
          <p className="text-sm mb-4" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            आपकी खूबसूरती हमारी ज़िम्मेदारी
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-white/60 mb-4">
            <span>सेवाएं</span>
            <span>•</span>
            <span>बुकिंग</span>
            <span>•</span>
            <span>ऑफ़र</span>
            <span>•</span>
            <span>हमसे संपर्क करें</span>
          </div>
          <p className="text-xs text-white/40">
            © 2026 Nikharta Roop. सर्वाधिकार सुरक्षित।
          </p>
        </div>
      </footer>
    </div>
  );
}
