import type { Update } from "grammy/types";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getBot } from "@/lib/telegram/instance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!safeEqual(secret, env.webhookSecret)) {
    return new Response("unauthorized", { status: 401 });
  }

  let update: Update;
  try {
    update = (await req.json()) as Update;
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (typeof update.update_id !== "number") return new Response("ok");

  // Takroriy yetkazishlarni dedupe qilish: qator allaqachon bo'lsa, darhol 200.
  const { data: inserted, error } = await getSupabaseAdmin()
    .from("tg_updates")
    .upsert({ update_id: update.update_id }, { onConflict: "update_id", ignoreDuplicates: true })
    .select("update_id");
  if (error) {
    // Baza ishlamasa, Telegram qayta yuborishi uchun 500.
    console.error("tg_updates insert failed", error.message);
    return new Response("db error", { status: 500 });
  }
  if (!inserted?.length) return new Response("ok");

  // Hech qachon exception tashlanmaydi: xato log'ga yoziladi, Telegram'ga 200 qaytadi.
  try {
    const bot = await getBot();
    await bot.handleUpdate(update);
  } catch (e) {
    console.error("handleUpdate failed", update.update_id, e);
  }
  return new Response("ok");
}
