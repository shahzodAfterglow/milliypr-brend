// npm run check — bot tokeni va (bo'lsa) Supabase ulanishini tekshiradi.
import { grammyClient } from "./_env";
import { Bot } from "grammy";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN yo'q");
  const bot = new Bot(token, { client: grammyClient });
  const me = await bot.api.getMe();
  console.log(`✅ Telegram: @${me.username} (id ${me.id}), inline: ${me.supports_inline_queries ? "YOQIQ ⚠️" : "o'chiq"}`);
  const wh = await bot.api.getWebhookInfo();
  console.log(`   webhook: ${wh.url || "(yo'q)"} · navbatda: ${wh.pending_update_count}` +
    (wh.last_error_message ? ` · oxirgi xato: ${wh.last_error_message}` : ""));

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("⏭  Supabase: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY o'rnatilmagan");
    return;
  }
  console.log(`   Supabase: ${new URL(url).host}`);
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("departments").select("slug, archive_chat_id, team_chat_id");
  if (error) throw new Error(`Supabase: ${error.message}`);
  console.log(`✅ Supabase: ${data.length} ta bo'lim`, data);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
