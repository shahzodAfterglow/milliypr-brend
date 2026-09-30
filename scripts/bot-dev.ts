// npm run bot:dev — dev-bot uchun long polling (lokal). Ishlab chiqarishda faqat webhook.
// Diqqat: deleteWebhook chaqiriladi, shuning uchun buni faqat sinov boti bilan ishlating.
import { grammyClient } from "./_env";
import { createBot, ALLOWED_UPDATES } from "@/lib/telegram/bot";

async function main() {
  const bot = createBot({ client: grammyClient });
  await bot.api.deleteWebhook({ drop_pending_updates: false });
  const me = await bot.api.getMe();
  console.log(`🤖 @${me.username} long polling rejimida. To'xtatish: Ctrl+C`);
  process.once("SIGINT", () => bot.stop());
  process.once("SIGTERM", () => bot.stop());
  await bot.start({ allowed_updates: [...ALLOWED_UPDATES] });
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
