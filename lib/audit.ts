import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

export type AuditEntry = {
  action: string;
  surface: "bot" | "sayt" | "tizim";
  actorMemberId?: number | null;
  actorTgId?: number | null;
  targetType?: string;
  targetId?: string | number;
  // Fayl mazmuni, tokenlar va maxfiy kalitlar yozilmaydi.
  meta?: Record<string, unknown>;
};

// Jurnal yozuvi hech qachon asosiy ishni to'xtatmaydi: xato faqat log'ga chiqadi.
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().from("audit_log").insert({
      action: entry.action,
      surface: entry.surface,
      actor_member_id: entry.actorMemberId ?? null,
      actor_tg_id: entry.actorTgId ?? null,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId != null ? String(entry.targetId) : null,
      meta: entry.meta ?? {},
    });
    if (error) console.error("audit insert failed", error.message);
  } catch (e) {
    console.error("audit insert threw", e);
  }
}
