import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { getBot } from "@/lib/telegram/instance";
import { configureBot, setupToken, systemStatus } from "@/lib/telegram/setup";

// GET — tizim holati (env nomlari, webhook, jadvallar). POST — webhook, buyruqlar va tavsiflarni
// server env'lari bilan o'rnatadi, keyin holatni qaytaradi. Kalitlar Vercel'dan tashqariga chiqmaydi.
// Authorization: Bearer sha256("prb-setup:" + TELEGRAM_BOT_TOKEN) — `npm run setup:remote`.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function authorized(req: Request): boolean | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const header = req.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${setupToken(token)}`);
}

function denied(state: boolean | null): Response | null {
  if (state === null) return new Response("TELEGRAM_BOT_TOKEN o'rnatilmagan", { status: 503, headers: noStore });
  if (!state) return new Response("unauthorized", { status: 401, headers: noStore });
  return null;
}

async function botApi() {
  try {
    return (await getBot()).api;
  } catch (e) {
    console.error("setup: getBot failed", e);
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  const deny = denied(authorized(req));
  if (deny) return deny;
  return Response.json(await systemStatus(await botApi()), { headers: noStore });
}

export async function POST(req: Request): Promise<Response> {
  const deny = denied(authorized(req));
  if (deny) return deny;

  const api = await botApi();
  let setup: unknown;
  if (!api) {
    setup = { error: "bot ishga tushmadi" };
  } else {
    try {
      setup = await configureBot(api, {
        webhookUrl: `${env.appUrl.replace(/\/$/, "")}/api/telegram/webhook`,
        secret: env.webhookSecret,
        adminIds: env.adminTgIds,
      });
    } catch (e) {
      setup = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  await audit({
    action: "bot_setup",
    surface: "tizim",
    meta: { ok: !(setup && typeof setup === "object" && "error" in setup) },
  });
  return Response.json({ setup, ...(await systemStatus(api)) }, { headers: noStore });
}
