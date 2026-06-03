/**
 * @file Auth pages layout — premium gradient background
 *
 * PURPOSE: Centered layout with a beautiful gradient background
 * for login and register pages. Dark mode fully supported.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-rose-50 via-white to-pink-50
      dark:from-zinc-950 dark:via-zinc-900 dark:to-rose-950
      px-4 py-8 transition-colors duration-300"
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Nikharta Roop"
            className="h-20 w-20 mx-auto rounded-2xl object-contain shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 mb-3"
          />
          <h1 className="text-3xl font-bold text-rose-600 dark:text-rose-400">
            निखरता रूप
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            आपकी खूबसूरती हमारी ज़िम्मेदारी
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
