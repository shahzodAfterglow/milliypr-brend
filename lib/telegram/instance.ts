import "server-only";
import type { Bot } from "grammy";
import { createBot } from "@/lib/telegram/bot";

// Serverless instance ichida bitta bot; getMe faqat birinchi so'rovda chaqiriladi.
let botPromise: Promise<Bot> | null = null;

export function getBot(): Promise<Bot> {
  if (!botPromise) {
    const bot = createBot();
    botPromise = bot.init().then(
      () => bot,
      (e) => {
        botPromise = null;
        throw e;
      },
    );
  }
  return botPromise;
}
