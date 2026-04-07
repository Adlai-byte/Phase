import type { VercelConfig } from "@vercel/config/v1";

const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",
  // Scheduled jobs — Vercel Cron automatically sends Authorization: Bearer <CRON_SECRET>
  crons: [
    {
      // Process invoice reminders daily at 1 AM UTC (9 AM PHT)
      path: "/api/cron/reminders",
      schedule: "0 1 * * *",
    },
  ],
};

export default config;
