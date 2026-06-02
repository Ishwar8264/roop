/**
 * Purpose: Auth pages layout (login, register) — Premium Salon Design
 * Responsibility: Split-screen layout with brand panel + form panel
 * Important Notes:
 *   - Route group (auth) — does NOT appear in URL
 *   - Desktop: Left brand panel (gradient + logo) | Right form panel (glassmorphism)
 *   - Mobile: Full-screen form with gradient background
 *   - Server component — no client logic
 *   - Animated decorative elements via CSS
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== Brand Panel (Desktop Only) ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-rose-600 via-pink-500 to-fuchsia-500">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.1),transparent_50%)]" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-white/10 blur-xl animate-pulse" />
        <div className="absolute bottom-32 right-16 w-32 h-32 rounded-full bg-white/10 blur-xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5 blur-lg animate-pulse [animation-delay:2s]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/logo.png"
              alt="Nikharta Roop"
              className="w-48 h-auto drop-shadow-2xl rounded-2xl"
            />
          </div>

          {/* Brand Name */}
          <h1
            className="text-5xl font-bold mb-3 tracking-tight"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          >
            निखरता रूप
          </h1>

          <p className="text-xl font-light text-white/90 mb-6">
            Nikharta Roop
          </p>

          {/* Tagline */}
          <p className="text-lg text-white/80 text-center max-w-sm leading-relaxed">
            Your beauty, our responsibility.
            <br />
            <span className="text-white/60 text-base">
              India&apos;s most trusted beauty parlour
            </span>
          </p>

          {/* Decorative line */}
          <div className="mt-10 flex items-center gap-3">
            <div className="h-px w-12 bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="h-px w-12 bg-white/30" />
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center gap-6 text-sm text-white/60">
            <span>4.8 Rating</span>
            <span>•</span>
            <span>5,000+ Customers</span>
            <span>•</span>
            <span>10,000+ Bookings</span>
          </div>
        </div>
      </div>

      {/* ===== Form Panel ===== */}
      <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-950/20 dark:via-background dark:to-pink-950/20 px-4 py-8">
        {/* Mobile background decorative */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl lg:hidden" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl lg:hidden" />

        {/* Mobile brand header */}
        <div className="absolute top-6 left-0 right-0 flex flex-col items-center lg:hidden">
          <img
            src="/logo.png"
            alt="Nikharta Roop"
            className="w-16 h-auto rounded-xl mb-2"
          />
          <h2
            className="text-xl font-bold text-primary"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          >
            निखरता रूप
          </h2>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mt-16 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
