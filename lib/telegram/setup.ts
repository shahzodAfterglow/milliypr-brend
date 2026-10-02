import "server-only";
import { createHash } from "node:crypto";
import type { Api } from "grammy";
import { ALLOWED_UPDATES } from "@/lib/telegram/bot";
import { getSupabaseAdmin } from "@/lib/supabase";
import { describeSupabaseUrl, normalizeSupabaseUrl } from "@/lib/env";

// Botni sozlash (webhook, buyruqlar, tavsiflar) va tizim holati. `npm run setup` (lokal) va
// `/api/telegram/setup` (server, kalitlar Vercel'dan chiqmaydi) shu kodni ishlatadi.

export type SetupResult = {
  webhook: string | null;
  admins: { id: number; ok: boolean; error?: string }[];
};

export async function configureBot(
  api: Api,
  opts: { webhookUrl?: string; secret?: string; adminIds: number[] },
): Promise<SetupResult> {
  if (opts.webhookUrl) {
    if (!opts.secret || !/^[A-Za-z0-9_-]{1,256}$/.test(opts.secret)) {
      throw new Error("TELEGRAM_WEBHOOK_SECRET faqat [A-Za-z0-9_-], 1–256 belgi bo'lishi kerak");
    }
    await api.setWebhook(opts.webhookUrl, {
      secret_token: opts.secret,
      allowed_updates: [...ALLOWED_UPDATES],
      drop_pending_updates: false,
    });
  }

  // Hamma uchun (0-bosqichda faqat /start ishlaydi; qolganlari bosqichma-bosqich qo'shiladi).
  await api.setMyCommands([{ command: "start", description: "Boshlash" }], {
    scope: { type: "all_private_chats" },
  });
  // Guruh va kanallarda buyruqlar ro'yxati bo'sh.
  await api.deleteMyCommands({ scope: { type: "all_group_chats" } });

  const admins: SetupResult["admins"] = [];
  for (const id of opts.adminIds) {
    try {
      await api.setMyCommands(
        [
          { command: "start", description: "Boshlash" },
          { command: "holat", description: "Tizim holati" },
        ],
        { scope: { type: "chat", chat_id: id } },
      );
      admins.push({ id, ok: true });
    } catch (e) {
      // Admin botni hali /start qilmagan bo'lishi mumkin.
      admins.push({ id, ok: false, error: (e as Error).message });
    }
  }

  await api.setMyDescription(
    "PR Brend — brend materiallari uchun ichki bot. Kirish faqat taklif havolasi orqali.",
  );
  await api.setMyShortDescription("Brend materiallari — doim oxirgi versiyasi.");
  return { webhook: opts.webhookUrl ?? null, admins };
}

// `/api/telegram/setup` uchun Bearer: bot tokenidan olinadi, shuning uchun alohida sir kerak emas.
// Token egasi baribir botni to'liq boshqaradi, bu marshrut unga yangi imkoniyat bermaydi.
export function setupToken(botToken: string): string {
  return createHash("sha256").update(`prb-setup:${botToken}`).digest("hex");
}

const ENV_NAMES = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "APP_URL",
  "ADMIN_TG_IDS",
  "BACKUP_CHAT_ID",
  "CRON_SECRET",
] as const;

const TABLES = [
  "departments", "members", "invites", "sessions", "login_tokens", "projects",
  "asset_types", "assets", "versions", "files", "feedback", "bot_messages",
  "audit_log", "tg_updates", "bot_state", "synonyms",
] as const;

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Faqat holat: qiymatlar emas, env nomlari bor-yo'qligi; jadvallardagi qatorlar soni.
export async function systemStatus(api: Api | null) {
  const env = Object.fromEntries(ENV_NAMES.map((n) => [n, Boolean(process.env[n])]));

  let bot: Record<string, unknown>;
  if (!api) {
    bot = { error: "bot ishga tushmadi" };
  } else {
    try {
      const [me, wh] = await Promise.all([api.getMe(), api.getWebhookInfo()]);
      bot = {
        username: me.username,
        webhook: wh.url || null,
        pending_update_count: wh.pending_update_count,
        last_error: wh.last_error_message
          ? { message: wh.last_error_message, at: new Date((wh.last_error_date ?? 0) * 1000).toISOString() }
          : null,
      };
    } catch (e) {
      bot = { error: errorText(e) };
    }
  }

  let db: Record<string, unknown>;
  try {
    const sb = getSupabaseAdmin();
    const counts = await Promise.all(
      TABLES.map(async (t) => {
        const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
        return [t, error ? `xato: ${error.message}` : count] as const;
      }),
    );
    const { data: departments, error } = await sb
      .from("departments")
      .select("slug, archive_chat_id, team_chat_id, is_active")
      .order("id");
    db = {
      host: new URL(normalizeSupabaseUrl(process.env.SUPABASE_URL ?? "")).host,
      tables: Object.fromEntries(counts),
      departments: error ? `xato: ${error.message}` : departments,
    };
  } catch (e) {
    db = { error: errorText(e) };
  }

  const deployment = {
    id: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };
  return { deployment, env, supabase_url: describeSupabaseUrl(process.env.SUPABASE_URL), bot, db };
}
