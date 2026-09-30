import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Uzunliklari farq qilsa ham vaqt bo'yicha barqaror solishtirish.
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}
