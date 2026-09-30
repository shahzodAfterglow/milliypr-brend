// npm run setup — idempotent: webhook, buyruqlar, tavsiflar.
// Lokal ishga tushiriladi, ishlab chiqarish env'lari bilan.
import { grammyClient } from "./_env";
import { Bot } from "grammy";

const ALLOWED_UPDATES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post",
  "callback_query",
  "my_chat_member",
] as const;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} o'rnatilmagan`);
  return v;
}

async function main() {
  const bot = new Bot(need("TELEGRAM_BOT_TOKEN"), { client: grammyClient });
  const skipWebhook = process.argv.includes("--no-webhook");

  if (!skipWebhook) {
    const secret = need("TELEGRAM_WEBHOOK_SECRET");
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
      throw new Error("TELEGRAM_WEBHOOK_SECRET faqat [A-Za-z0-9_-], 1–256 belgi bo'lishi kerak");
    }
    const url = `${need("APP_URL").replace(/\/$/, "")}/api/telegram/webhook`;
    await bot.api.setWebhook(url, {
      secret_token: secret,
      allowed_updates: [...ALLOWED_UPDATES],
      drop_pending_updates: false,
    });
    console.log(`✅ webhook → ${url}`);
  }

  // Hamma uchun (0-bosqichda faqat /start ishlaydi; qolganlari bosqichma-bosqich qo'shiladi).
  await bot.api.setMyCommands([{ command: "start", description: "Boshlash" }], {
    scope: { type: "all_private_chats" },
  });
  // Guruh va kanallarda buyruqlar ro'yxati bo'sh.
  await bot.api.deleteMyCommands({ scope: { type: "all_group_chats" } });

  const adminIds = (process.env.ADMIN_TG_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isSafeInteger(n) && n !== 0);
  for (const id of adminIds) {
    try {
      await bot.api.setMyCommands(
        [
          { command: "start", description: "Boshlash" },
          { command: "holat", description: "Tizim holati" },
        ],
        { scope: { type: "chat", chat_id: id } },
      );
      console.log(`✅ admin buyruqlari → ${id}`);
    } catch (e) {
      console.warn(`⚠️  ${id}: ${(e as Error).message} (admin botni hali /start qilmagan bo'lishi mumkin)`);
    }
  }

  await bot.api.setMyDescription(
    "PR Brend — brend materiallari uchun ichki bot. Kirish faqat taklif havolasi orqali.",
  );
  await bot.api.setMyShortDescription("Brend materiallari — doim oxirgi versiyasi.");
  console.log("✅ buyruqlar va tavsiflar o'rnatildi");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
