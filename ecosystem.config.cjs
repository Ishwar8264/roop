/**
 * Nikharta Roop (निखरता रूप) — PM2 Ecosystem Config
 *
 * Commands:
 *   pnpm dev:pm2       → Start dev server (always running, auto-restart)
 *   pnpm dev:stop      → Stop dev server
 *   pnpm dev:restart   → Restart dev server
 *   pnpm dev:logs      → View live logs
 *   pnpm dev:status    → Check server status
 */

module.exports = {
  apps: [
    {
      name: "nikharta-roop-dev",
      script: "/home/z/my-project/node_modules/next/dist/bin/next",
      args: "dev -p 3000 -H 0.0.0.0",
      cwd: "/home/z/my-project",
      interpreter: "node",
      env: {
        DATABASE_URL: "postgresql://ishwar:IshwarRiverHead@localhost:5432/nikharta_roop?schema=public",
        NODE_ENV: "development",
      },
      // Auto-restart settings
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      // Log settings
      error_file: "/home/z/my-project/logs/pm2-error.log",
      out_file: "/home/z/my-project/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Memory limit — restart if exceeds
      max_memory_restart: "500M",
    },
  ],
};
