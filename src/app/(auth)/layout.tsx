/**
 * Purpose: Auth pages layout (login, register)
 * Responsibility: Centered layout with gradient background for auth pages
 * Important Notes:
 *   - Route group (auth) — does NOT appear in URL
 *   - Server component — no client logic
 *   - No navigation — auth pages are standalone
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">निखरता रूप</h1>
          <p className="text-sm text-muted-foreground mt-1">
            आपकी खूबसूरती हमारी ज़िम्मेदारी
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
