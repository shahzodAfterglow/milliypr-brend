// npm run setup:remote -- <APP_URL> [--apply]
// Serverdagi /api/telegram/setup'ni chaqiradi: bo'sh — faqat holat (GET), --apply — webhook, buyruqlar
// va tavsiflarni server env'lari bilan o'rnatadi (POST). Webhook siri va Supabase kalitlari Vercel'da
// qoladi; bu yerda faqat TELEGRAM_BOT_TOKEN kerak (Bearer undan hisoblanadi).
import "./_env";
import { createHash } from "node:crypto";

async function main() {
  const base = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? process.env.APP_URL;
  if (!base) throw new Error("Manzil kerak: npm run setup:remote -- https://<host> [--apply]");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  const apply = process.argv.includes("--apply");

  const url = `${base.replace(/\/$/, "")}/api/telegram/setup`;
  const bearer = createHash("sha256").update(`prb-setup:${token}`).digest("hex");
  const res = await fetch(url, { method: apply ? "POST" : "GET", headers: { Authorization: `Bearer ${bearer}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${url}: ${text.slice(0, 300)}`);
  console.log(JSON.stringify(JSON.parse(text), null, 2));
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
