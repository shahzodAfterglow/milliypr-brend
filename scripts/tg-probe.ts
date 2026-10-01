// npm run probe — 0-bosqichdagi Telegram sinovi (docs/CONCEPT.md, Ilova O), faqat sinov boti bilan.
// Sinov kanaliga va guruhiga "SINOV" belgili xabarlar yozadi, natijani jadval qilib chiqaradi.
//
//   npm run probe                                  # kanal/guruh — departments (branding) jadvalidan
//   npm run probe -- --channel -100… --group -100… --to <tg id>
//   npm run probe -- --old <message_id>            # bot qo'shilishidan oldingi postni forward qilish
//   npm run probe -- --edit-group <message_id>     # 24 soatdan keyin guruh xabarini qayta tahrirlash
//
// Qurilmada qo'lda tekshiriladiganlar (oxirida ro'yxat chiqadi): protect_content forward taqiqi,
// login_url (3-bosqich), token revoke'dan keyin file_id (3-bosqich).
import { grammyClient } from "./_env";
import { Bot, InputFile, GrammyError } from "grammy";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

type Row = { check: string; ok: boolean | null; note: string; fallback: string };
const rows: Row[] = [];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

function errText(e: unknown): string {
  if (e instanceof GrammyError) return e.description;
  return (e as Error).message;
}

async function step<T>(check: string, fallback: string, fn: () => Promise<[T, string]>): Promise<T | null> {
  try {
    const [value, note] = await fn();
    rows.push({ check, ok: true, note, fallback });
    return value;
  } catch (e) {
    rows.push({ check, ok: false, note: errText(e), fallback });
    return null;
  }
}

function skip(check: string, note: string, fallback: string) {
  rows.push({ check, ok: null, note, fallback });
}

async function testPng(label: string, color: string): Promise<Buffer> {
  return sharp({ create: { width: 640, height: 360, channels: 3, background: color } })
    .composite([
      {
        input: Buffer.from(
          `<svg width="640" height="360"><text x="32" y="200" font-size="56" font-family="sans-serif" fill="#fff">${label}</text></svg>`,
        ),
      },
    ])
    .png()
    .toBuffer();
}

async function chatsFromDb(): Promise<{ channel?: number; group?: number }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return {};
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("departments")
    .select("archive_chat_id, team_chat_id")
    .eq("slug", "branding")
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return { channel: data?.archive_chat_id ?? undefined, group: data?.team_chat_id ?? undefined };
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN yo'q");
  const bot = new Bot(token, { client: grammyClient });
  const me = await bot.api.getMe();
  const wh = await bot.api.getWebhookInfo();
  if (wh.url && !process.argv.includes("--force")) {
    throw new Error(
      `@${me.username}'da webhook o'rnatilgan — ehtimol ishlab chiqarish boti. ` +
        "Sinov xabarlari haqiqiy kanalga tushmasligi uchun to'xtatildi (`--force` bilan chetlab o'tiladi).",
    );
  }

  const editGroup = arg("edit-group");
  const fromDb = await chatsFromDb();
  const channel = Number(arg("channel") ?? fromDb.channel);
  const group = Number(arg("group") ?? fromDb.group);
  const to = Number(arg("to") ?? (process.env.ADMIN_TG_IDS ?? "").split(",")[0]);
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

  if (editGroup) {
    if (!group) throw new Error("--group yoki bog'langan jamoa guruhi kerak");
    await step("Guruhdagi o'z xabarini keyinroq tahrirlash", "Yangi holat xabarini reply qilib yuborish", async () => {
      await bot.api.editMessageText(group, Number(editGroup), `🧪 SINOV · ✅ ${stamp} da qayta tahrirlandi`);
      return [true, `message_id ${editGroup}`];
    });
    return print(me.username);
  }

  if (!channel || !to) {
    throw new Error("Kanal (--channel yoki departments.archive_chat_id) va --to (yoki ADMIN_TG_IDS) kerak");
  }

  // 0. Huquqlar
  await step("Bot arxiv kanalida admin (post yozish, tahrirlash)", "Kanal sozlamalarida huquq berish", async () => {
    const m = await bot.api.getChatMember(channel, me.id);
    if (m.status !== "administrator") throw new Error(`holat: ${m.status}`);
    if (!m.can_post_messages || !m.can_edit_messages) {
      throw new Error(`post: ${m.can_post_messages}, tahrir: ${m.can_edit_messages}`);
    }
    return [true, "post ✓, tahrir ✓"];
  });

  // 1. Kanalga fayl (hujjat sifatida) joylash — keyingi qadamlar uchun file_id
  const a = await step("Kanalga hujjat joylash (sendDocument)", "—", async () => {
    const msg = await bot.api.sendDocument(channel, new InputFile(await testPng("SINOV · v1", "#1f6feb"), "sinov-v1.png"), {
      caption: `🧪 SINOV · Taklifnoma (UZ) · v1 · ${stamp}`,
    });
    return [msg, `message_id ${msg.message_id}`];
  });
  const b = await step("Ikkinchi hujjat", "—", async () => {
    const msg = await bot.api.sendDocument(channel, new InputFile(await testPng("SINOV · v2", "#8250df"), "sinov-v2.png"), {
      caption: `🧪 SINOV · Taklifnoma (UZ) · v2 · ${stamp}`,
    });
    return [msg, `message_id ${msg.message_id}`];
  });

  if (a?.document) {
    // 2. copyMessage: izohni almashtirish + protect_content
    await step("copyMessage kanal → DM, izoh almashtiriladi, protect_content", "file_id bilan sendDocument", async () => {
      const r = await bot.api.copyMessage(to, channel, a.message_id, {
        caption: "🧪 SINOV · bot yozgan izoh (kanaldagidan farqli) · 🔒 forward qilib bo'lmasligi kerak",
        protect_content: true,
      });
      return [r, `DM message_id ${r.message_id}`];
    });

    // 3. file_id bilan yuborish (zaxira yo'l)
    await step("file_id bilan sendDocument (zaxira yo'l)", "Fayl buzilgan → broken_at", async () => {
      const r = await bot.api.sendDocument(to, a.document!.file_id, { caption: "🧪 SINOV · file_id orqali" });
      return [r, `DM message_id ${r.message_id}`];
    });

    // 4. Kanaldagi bot postining izohini tahrirlash
    await step("Bot o'z kanal postining izohini tahrirlaydi", "Yangi post", async () => {
      await bot.api.editMessageCaption(channel, a.message_id, {
        caption: `🧪 SINOV · Taklifnoma (UZ) · v1 · ESKIRGAN · ${stamp}`,
      });
      return [true, "izoh yangilandi"];
    });

    // 5. Reaksiya
    await step("setMessageReaction kanal postiga", "Reaksiyasiz; asosiy signal guruh xabari", async () => {
      await bot.api.setMessageReaction(channel, a.message_id, [{ type: "emoji", emoji: "👀" }]);
      return [true, "👀"];
    });
  } else {
    skip("copyMessage / file_id / tahrir / reaksiya", "kanalga fayl joylanmadi", "—");
  }

  // 6. Albom: sendMediaGroup(file_id) → copyMessages
  if (a?.document && b?.document) {
    const album = await step("sendMediaGroup (hujjatlar) kanalga file_id bilan", "Alohida postlar", async () => {
      const msgs = await bot.api.sendMediaGroup(channel, [
        { type: "document", media: a.document!.file_id },
        { type: "document", media: b.document!.file_id, caption: `🧪 SINOV · albom · ${stamp}` },
      ]);
      const ids = msgs.map((m) => m.message_id);
      const group = "media_group_id" in msgs[0] ? String(msgs[0].media_group_id) : "—";
      return [ids, `message_id ${ids.join(", ")} · media_group_id ${group}`];
    });
    if (album) {
      await step("copyMessages albomni DM'ga", "sendMediaGroup(file_id) DM'ga", async () => {
        const r = await bot.api.copyMessages(to, channel, album, { protect_content: true });
        return [r, `${r.length} ta xabar`];
      });
    }
  } else {
    skip("sendMediaGroup / copyMessages", "fayllar yo'q", "Alohida postlar");
  }

  // 7. Bot qo'shilishidan oldingi post
  const old = arg("old");
  if (old) {
    await step(`Eski postni forwardMessage by id (${old})`, "Qo'lda forward, /import", async () => {
      const r = await bot.api.forwardMessage(to, channel, Number(old));
      return [r, `DM message_id ${r.message_id}`];
    });
  } else {
    skip("Eski postni forwardMessage by id", "--old <message_id> berilmadi", "Qo'lda forward, /import");
  }

  // 8. Jamoa guruhi: o'z xabarini tahrirlash, reply'larni ko'rish (admin = privacy mode ta'sir qilmaydi)
  if (group) {
    await step("Bot jamoa guruhida admin (reply'larni ko'radi)", "Bot xabariga reply qilishni so'rash", async () => {
      const m = await bot.api.getChatMember(group, me.id);
      if (m.status !== "administrator") throw new Error(`holat: ${m.status} (privacy mode: faqat buyruq va reply'lar)`);
      return [true, "admin → guruhdagi barcha xabarlar keladi"];
    });
    const g = await step("Guruhga xabar va joyida tahrirlash", "Yangi holat xabarini reply qilib yuborish", async () => {
      const msg = await bot.api.sendMessage(group, `🧪 SINOV · Taklifnoma (UZ) v1 · ⏳ ko'rib chiqilmoqda · ${stamp}`);
      await bot.api.editMessageText(group, msg.message_id, `🧪 SINOV · Taklifnoma (UZ) v1 · 👀 Rahbar ko'rdi · ${stamp}`);
      return [msg.message_id, `message_id ${msg.message_id}`];
    });
    if (g) skip("24 soatdan keyin tahrirlash", `npm run probe -- --edit-group ${g}`, "Yangi holat xabarini reply qilib yuborish");
  } else {
    skip("Jamoa guruhi", "--group berilmadi va bog'lanmagan", "—");
  }

  print(me.username);
}

function print(username?: string) {
  const mark = (ok: boolean | null) => (ok === true ? "✅" : ok === false ? "❌" : "⏭");
  console.log(`\n| Tekshiruv (@${username}) | Natija | Izoh | Ishlamasa |\n|---|---|---|---|`);
  for (const r of rows) {
    console.log(`| ${r.check} | ${mark(r.ok)} | ${r.note.replace(/\|/g, "/")} | ${r.fallback} |`);
  }
  console.log(
    "\nQo'lda: DM'dagi 🔒 xabarni iOS va Android'da forward/saqlab ko'ring (bo'lmasligi kerak); " +
      "login_url va token revoke — 3-bosqich mashqlarida.",
  );
  if (rows.some((r) => r.ok === false)) process.exitCode = 2;
}

main().catch((e) => {
  console.error("❌", errText(e));
  process.exit(1);
});
