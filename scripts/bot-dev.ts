// npm run bot:dev — dev-bot uchun long polling (lokal). Ishlab chiqarishda faqat webhook.
// Diqqat: deleteWebhook chaqiriladi, shuning uchun buni faqat sinov boti bilan ishlating.
// Webhook o'rnatilgan bo'lsa (ya'ni bu ishlab chiqarish boti), `--force`siz ishga tushmaydi.
import { grammyClient } from "./_env";
import { createBot, ALLOWED_UPDATES } from "@/lib/telegram/bot";

async function main() {
  const bot = createBot({ client: grammyClient });
  const wh = await bot.api.getWebhookInfo();
  if (wh.url && !process.argv.includes("--force")) {
    throw new Error(
      `Bu botda webhook o'rnatilgan (${wh.url}) — ehtimol ishlab chiqarish boti. ` +
        "Long polling webhook'ni o'chiradi. Sinov boti tokenini ishlating yoki `npm run bot:dev -- --force`.",
    );
  }
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
