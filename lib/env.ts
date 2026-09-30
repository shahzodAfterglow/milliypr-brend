import "server-only";

// Barcha env o'zgaruvchilari server-only. Yo'q bo'lsa aniq xato beriladi (fail closed).
function required(name: string): string {
  const value = process.env[name];
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
    return required("SUPABASE_URL");
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

export function parseIdList(raw: string | undefined): number[] {
  return (raw ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isSafeInteger(n) && n !== 0);
}
