import "server-only";

// Barcha env o'zgaruvchilari server-only. Yo'q bo'lsa aniq xato beriladi (fail closed).
// Chetdagi bo'shliq va yangi qator olib tashlanadi: panelga nusxa ko'chirishda tez-tez qoladi.
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Env o'zgaruvchisi o'rnatilmagan: ${name}`);
  return value;
}

export const env = {
  get botToken() {
    return required("TELEGRAM_BOT_TOKEN");
  },
  get botUsername() {
    return required("TELEGRAM_BOT_USERNAME");
  },
  get webhookSecret() {
    return required("TELEGRAM_WEBHOOK_SECRET");
  },
  get supabaseUrl() {
    return normalizeSupabaseUrl(required("SUPABASE_URL"));
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get appUrl() {
    return required("APP_URL");
  },
  get backupChatId(): number | null {
    const raw = process.env.BACKUP_CHAT_ID;
    return raw ? Number(raw) : null;
  },
  get adminTgIds(): number[] {
    return parseIdList(process.env.ADMIN_TG_IDS);
  },
};

// Panelga ko'chirishda tez-tez uchraydigan xatolar: oxiridagi "/" yoki "/rest/v1", sxemasiz host.
export function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  if (/^[a-z]{20}$/.test(url)) url = `${url}.supabase.co`; // faqat loyiha ID'si (ref)
  if (/^[a-z0-9-]+\.supabase\.co$/i.test(url)) url = `https://${url}`;
  return url;
}

// SUPABASE_URL shakli, qiymatni oshkor qilmasdan (connection string'da parol bo'lishi mumkin).
export function describeSupabaseUrl(raw: string | undefined): string {
  const v = raw?.trim() ?? "";
  if (!v) return "yo'q";
  if (/^postgres(ql)?:\/\//i.test(v)) return "postgres connection string kiritilgan (parol bor!) — Project URL kerak";
  const url = normalizeSupabaseUrl(v);
  if (/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return "ok";
  if (/^https?:\/\//i.test(url)) return "http(s) URL, lekin *.supabase.co emas";
  return `URL emas (${v.length} belgi, "https://" bilan boshlanmaydi)`;
}

export function parseIdList(raw: string | undefined): number[] {
  return (raw ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isSafeInteger(n) && n !== 0);
}
