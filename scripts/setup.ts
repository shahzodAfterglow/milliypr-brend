// npm run setup — idempotent: webhook, buyruqlar, tavsiflar (lib/telegram/setup.ts).
// Ishlab chiqarish uchun: ENV_FILE=.env.prod.local npm run setup. Yoki serverning o'zida, kalitlarni
// Vercel'dan chiqarmasdan: npm run setup:remote -- <APP_URL> --apply.
import { grammyClient } from "./_env";
import { Bot } from "grammy";
import { parseIdList } from "@/lib/env";
import { configureBot } from "@/lib/telegram/setup";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} o'rnatilmagan`);
  return v;
}

async function main() {
  const bot = new Bot(need("TELEGRAM_BOT_TOKEN"), { client: grammyClient });
  const skipWebhook = process.argv.includes("--no-webhook");

  const result = await configureBot(bot.api, {
    webhookUrl: skipWebhook ? undefined : `${need("APP_URL").replace(/\/$/, "")}/api/telegram/webhook`,
    secret: skipWebhook ? undefined : need("TELEGRAM_WEBHOOK_SECRET"),
    adminIds: parseIdList(process.env.ADMIN_TG_IDS),
  });

  if (result.webhook) console.log(`✅ webhook → ${result.webhook}`);
  for (const a of result.admins) {
    if (a.ok) console.log(`✅ admin buyruqlari → ${a.id}`);
    else console.warn(`⚠️  ${a.id}: ${a.error} (admin botni hali /start qilmagan bo'lishi mumkin)`);
  }
  console.log("✅ buyruqlar va tavsiflar o'rnatildi");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
