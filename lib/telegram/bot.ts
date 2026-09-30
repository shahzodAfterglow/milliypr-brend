import "server-only";
import { Bot, InlineKeyboard, type BotConfig, type Context } from "grammy";
import type { Message, UserFromGetMe } from "grammy/types";
import { autoRetry } from "@grammyjs/auto-retry";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase";
import { audit } from "@/lib/audit";

// 0-bosqich: /start, ro'yxatda yo'q odamga muloyim rad javobi, bot yangi chatga admin
// qilinganda uni bo'limga biriktirish va arxiv kanalidagi postlarni `files`ga yozish.
// Qidiruv, yuklash ustasi, yetkazish va tasdiqlash — 1–2-bosqichlarda.

type Member = {
  id: number;
  role: "admin" | "rahbar" | "bolim_boshligi" | "dizayner" | "kuzatuvchi";
  status: "invited" | "active" | "removed";
  display_name: string;
};

type Department = {
  id: number;
  slug: string;
  name_uz: string;
  archive_chat_id: number | null;
  team_chat_id: number | null;
};

const REJECT_TEXT =
  "Bu bot ichki foydalanish uchun. Kirish uchun administratordan taklif havolasi so'rang.";

export const ALLOWED_UPDATES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post",
  "callback_query",
  "my_chat_member",
] as const;

// ---------- ma'lumotlar yordamchilari ----------

async function findMember(tgId: number): Promise<Member | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .select("id, role, status, display_name")
    .eq("telegram_user_id", tgId)
    .maybeSingle();
  if (error) throw new Error(`members select: ${error.message}`);
  return data as Member | null;
}

function isEnvAdmin(tgId: number): boolean {
  return env.adminTgIds.includes(tgId);
}

async function isAdmin(tgId: number): Promise<boolean> {
  if (isEnvAdmin(tgId)) return true;
  const m = await findMember(tgId);
  return m?.status === "active" && m.role === "admin";
}

function displayName(from: { first_name: string; last_name?: string }): string {
  return [from.first_name, from.last_name].filter(Boolean).join(" ").slice(0, 120);
}

// ADMIN_TG_IDS dagi odam birinchi /start bosganda members'ga admin sifatida yoziladi.
async function ensureEnvAdmin(ctx: Context): Promise<Member> {
  const from = ctx.from!;
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("members")
    .upsert(
      {
        telegram_user_id: from.id,
        display_name: displayName(from),
        tg_username: from.username ?? null,
        role: "admin",
        status: "active",
        can_approve: true,
        bot_started_at: now,
        last_seen_at: now,
      },
      { onConflict: "telegram_user_id" },
    )
    .select("id, role, status, display_name")
    .single();
  if (error) throw new Error(`members upsert: ${error.message}`);
  return data as Member;
}

async function listDepartments(): Promise<Department[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("departments")
    .select("id, slug, name_uz, archive_chat_id, team_chat_id")
    .eq("is_active", true)
    .order("id");
  if (error) throw new Error(`departments select: ${error.message}`);
  return (data ?? []) as Department[];
}

async function findDepartmentByArchive(chatId: number): Promise<Department | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("departments")
    .select("id, slug, name_uz, archive_chat_id, team_chat_id")
    .eq("archive_chat_id", chatId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`departments select: ${error.message}`);
  return data as Department | null;
}

async function adminChatIds(): Promise<number[]> {
  const { data } = await getSupabaseAdmin()
    .from("members")
    .select("telegram_user_id")
    .eq("role", "admin")
    .eq("status", "active")
    .not("telegram_user_id", "is", null);
  const ids = new Set<number>(env.adminTgIds);
  for (const row of data ?? []) ids.add(Number(row.telegram_user_id));
  return [...ids];
}

async function notifyAdmins(
  bot: Bot,
  text: string,
  keyboard?: InlineKeyboard,
): Promise<void> {
  for (const id of await adminChatIds()) {
    try {
      await bot.api.sendMessage(id, text, { reply_markup: keyboard });
    } catch (e) {
      // Admin botni hali /start qilmagan bo'lishi mumkin.
      console.warn("notifyAdmins failed", id, (e as Error).message);
    }
  }
}

// ---------- fayl ma'lumotini xabardan olish ----------

type ExtractedFile = {
  kind: "document" | "photo" | "video" | "animation" | "audio";
  file_id: string;
  file_unique_id: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  is_image: boolean;
};

export function extractFile(msg: Message): ExtractedFile | null {
  if (msg.animation) {
    const a = msg.animation;
    return {
      kind: "animation",
      file_id: a.file_id,
      file_unique_id: a.file_unique_id,
      file_name: a.file_name ?? null,
      mime_type: a.mime_type ?? null,
      file_size: a.file_size ?? null,
      width: a.width,
      height: a.height,
      is_image: false,
    };
  }
  if (msg.document) {
    const d = msg.document;
    return {
      kind: "document",
      file_id: d.file_id,
      file_unique_id: d.file_unique_id,
      file_name: d.file_name ?? null,
      mime_type: d.mime_type ?? null,
      file_size: d.file_size ?? null,
      width: null,
      height: null,
      is_image: /^image\/(png|jpeg|webp)$/.test(d.mime_type ?? ""),
    };
  }
  if (msg.photo?.length) {
    const p = msg.photo[msg.photo.length - 1];
    return {
      kind: "photo",
      file_id: p.file_id,
      file_unique_id: p.file_unique_id,
      file_name: null,
      mime_type: "image/jpeg",
      file_size: p.file_size ?? null,
      width: p.width,
      height: p.height,
      is_image: true,
    };
  }
  if (msg.video) {
    const v = msg.video;
    return {
      kind: "video",
      file_id: v.file_id,
      file_unique_id: v.file_unique_id,
      file_name: v.file_name ?? null,
      mime_type: v.mime_type ?? null,
      file_size: v.file_size ?? null,
      width: v.width,
      height: v.height,
      is_image: false,
    };
  }
  if (msg.audio) {
    const a = msg.audio;
    return {
      kind: "audio",
      file_id: a.file_id,
      file_unique_id: a.file_unique_id,
      file_name: a.file_name ?? null,
      mime_type: a.mime_type ?? null,
      file_size: a.file_size ?? null,
      width: null,
      height: null,
      is_image: false,
    };
  }
  return null;
}

// ---------- bot ----------

export function createBot(options?: {
  botInfo?: UserFromGetMe;
  client?: BotConfig<Context>["client"];
}): Bot {
  const bot = new Bot(env.botToken, { botInfo: options?.botInfo, client: options?.client });
  bot.api.config.use(autoRetry({ maxRetryAttempts: 2, maxDelaySeconds: 5 }));

  // Guruh va kanallardagi buyruqlar e'tiborsiz qoldiriladi; bot bilan ishlash faqat DM'da.
  const dm = bot.chatType("private");

  dm.command("start", async (ctx) => {
    const from = ctx.from;
    const payload = ctx.match?.trim() ?? "";

    let member = await findMember(from.id);
    if (isEnvAdmin(from.id)) member = await ensureEnvAdmin(ctx);

    if (!member || member.status !== "active") {
      await ctx.reply(REJECT_TEXT);
      await audit({
        action: "start_rejected",
        surface: "bot",
        actorTgId: from.id,
        meta: { has_payload: payload.length > 0 },
      });
      return;
    }

    await getSupabaseAdmin()
      .from("members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", member.id);

    const lines = [
      `Assalomu alaykum, ${member.display_name}!`,
      "",
      "PR Brend — brend materiallari uchun ichki bot. Hozir sinov (0-bosqich) rejimida ishlayapti.",
      "Qidiruv, yuklash va tasdiqlash keyingi bosqichlarda qo'shiladi.",
    ];
    if (member.role === "admin") {
      lines.push(
        "",
        "Admin uchun: botni arxiv kanali yoki jamoa guruhiga admin qilib qo'shing — men sizdan qaysi bo'limga biriktirishni so'rayman.",
      );
    }
    await ctx.reply(lines.join("\n"));
    await audit({
      action: "start",
      surface: "bot",
      actorMemberId: member.id,
      actorTgId: from.id,
    });
  });

  dm.command("holat", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) return ctx.reply(REJECT_TEXT);
    const depts = await listDepartments();
    const { count } = await getSupabaseAdmin()
      .from("files")
      .select("id", { count: "exact", head: true })
      .is("version_id", null);
    const info = await ctx.api.getWebhookInfo();
    const lines = [
      "🩺 Tizim holati (0-bosqich)",
      `Webhook: ${info.url ? "o'rnatilgan" : "yo'q (long polling)"}` +
        (info.pending_update_count ? ` · navbatda ${info.pending_update_count}` : "") +
        (info.last_error_message ? `\nOxirgi xato: ${info.last_error_message}` : ""),
      `Saralanmagan fayllar: ${count ?? 0}`,
      "",
      ...depts.map(
        (d) =>
          `• ${d.name_uz}: arxiv ${d.archive_chat_id ? "✅" : "—"} · jamoa ${d.team_chat_id ? "✅" : "—"}`,
      ),
    ];
    await ctx.reply(lines.join("\n"));
  });

  // Boshqa har qanday DM matni: 1-bosqichda bu qidiruv bo'ladi.
  dm.on("message", async (ctx) => {
    const member = await findMember(ctx.from.id);
    if (!isEnvAdmin(ctx.from.id) && member?.status !== "active") {
      await ctx.reply(REJECT_TEXT);
      return;
    }
    await ctx.reply("Qidiruv va fayl yuklash 1-bosqichda ishga tushadi. Hozircha /start va /holat ishlaydi.");
  });

  // Bot chatga qo'shilganda yoki huquqi o'zgarganda.
  bot.on("my_chat_member", async (ctx) => {
    const upd = ctx.myChatMember;
    const chat = upd.chat;
    if (chat.type === "private") return;
    const title = chat.title;
    const status = upd.new_chat_member.status;

    if (status === "administrator") {
      const depts = await listDepartments();
      const kb = new InlineKeyboard();
      for (const d of depts) {
        if (chat.type === "channel") kb.text(`🗄 Arxiv kanali: ${d.name_uz}`, `ch:${chat.id}:${d.id}:a`).row();
        else kb.text(`👥 Jamoa guruhi: ${d.name_uz}`, `ch:${chat.id}:${d.id}:t`).row();
      }
      kb.text("🚪 Chiqib ketish", `ch:${chat.id}:0:x`);
      await notifyAdmins(
        bot,
        `Bot "${title}" (${chat.type}, ${chat.id}) chatiga admin qilindi. Qaysi bo'limga biriktiramiz?`,
        kb,
      );
    } else if (status === "left" || status === "kicked" || status === "member" || status === "restricted") {
      const known = await getSupabaseAdmin()
        .from("departments")
        .select("id")
        .or(`archive_chat_id.eq.${chat.id},team_chat_id.eq.${chat.id}`);
      if (known.data?.length) {
        await notifyAdmins(bot, `⚠️ Bot "${title}" chatida adminlikdan mahrum qilindi yoki chiqarildi (holat: ${status}). Arxivga yozish to'xtaydi.`);
      }
    }
    await audit({
      action: "my_chat_member",
      surface: "bot",
      actorTgId: upd.from.id,
      targetType: "chat",
      targetId: chat.id,
      meta: { status, chat_type: chat.type },
    });
  });

  bot.callbackQuery(/^ch:(-?\d+):(\d+):([atx])$/, async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
      await ctx.answerCallbackQuery({ text: "Ruxsat yo'q", show_alert: true });
      return;
    }
    const [, chatIdRaw, deptIdRaw, action] = ctx.match;
    const chatId = Number(chatIdRaw);
    const deptId = Number(deptIdRaw);

    if (action === "x") {
      try {
        await ctx.api.leaveChat(chatId);
      } catch (e) {
        console.warn("leaveChat failed", (e as Error).message);
      }
      await ctx.answerCallbackQuery({ text: "Chatdan chiqildi" });
      await ctx.editMessageText(`🚪 Bot ${chatId} chatidan chiqdi.`);
    } else {
      const column = action === "a" ? "archive_chat_id" : "team_chat_id";
      const { data, error } = await getSupabaseAdmin()
        .from("departments")
        .update({ [column]: chatId })
        .eq("id", deptId)
        .select("name_uz")
        .single();
      if (error) {
        await ctx.answerCallbackQuery({ text: `Xato: ${error.message}`.slice(0, 190), show_alert: true });
        return;
      }
      await ctx.answerCallbackQuery({ text: "Saqlandi" });
      await ctx.editMessageText(
        `✅ ${chatId} → ${data.name_uz}: ${action === "a" ? "arxiv kanali" : "jamoa guruhi"}.`,
      );
    }
    await audit({
      action: "chat_bind",
      surface: "bot",
      actorTgId: ctx.from.id,
      targetType: "chat",
      targetId: chatId,
      meta: { department_id: deptId, kind: action },
    });
  });

  // Arxiv kanalidagi postlar: 0-bosqichda faqat `files`ga "Saralanmagan" sifatida yoziladi.
  bot.on("channel_post", async (ctx) => {
    const post = ctx.channelPost;
    const dept = await findDepartmentByArchive(post.chat.id);
    if (!dept) return; // ro'yxatga olinmagan kanal

    const file = extractFile(post);
    if (!file) return; // faqat matnli post

    const { error } = await getSupabaseAdmin()
      .from("files")
      .upsert(
        {
          version_id: null,
          chat_id: post.chat.id,
          message_id: post.message_id,
          ...file,
          origin: {
            caption: post.caption?.slice(0, 1024) ?? null,
            media_group_id: post.media_group_id ?? null,
            reply_to_message_id: post.reply_to_message?.message_id ?? null,
          },
        },
        { onConflict: "chat_id,message_id" },
      );

    if (error) {
      // 23505: shu file_unique_id allaqachon boshqa postda bor.
      await audit({
        action: error.code === "23505" ? "channel_post_duplicate" : "channel_post_error",
        surface: "bot",
        targetType: "chat",
        targetId: post.chat.id,
        meta: { message_id: post.message_id, code: error.code, message: error.message },
      });
      return;
    }
    await audit({
      action: "channel_post_indexed",
      surface: "bot",
      targetType: "file",
      targetId: `${post.chat.id}:${post.message_id}`,
      meta: { department: dept.slug, kind: file.kind, file_size: file.file_size },
    });
  });

  bot.catch((err) => {
    console.error("bot error", err.error);
  });

  return bot;
}
