# PR Brend — Claude Code uchun qo'llanma

Milliy PR markazi rahbariyati va branding bo'limi uchun ichki tizim: Telegram bot (asosiy) +
kichik sayt (`pr.promthub.uz`). To'liq konsepsiya: [`docs/CONCEPT.md`](docs/CONCEPT.md).
Texnik qarorlar — o'sha hujjatning "Texnik ilova" qismi (A–T). Qaror o'zgarsa, avval hujjatni yangilang.

**Bu repoga hech qachon maxfiy kalit, token yoki parol yozilmaydi** (shu fayl ham). Kalitlar faqat
`.env.local` (gitignore'da) va Vercel env'da.

## Stek

- Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui primitivlari (`components/ui`).
- Bot: `grammy` + `@grammyjs/auto-retry`. Ishlab chiqarishda faqat webhook
  (`app/api/telegram/webhook`), lokal sinovda `npm run bot:dev` (long polling, faqat sinov boti!).
- Baza: Supabase (Frankfurt), faqat serverda `service_role` bilan (`lib/supabase.ts`).
  Anon client, Supabase Auth, `NEXT_PUBLIC_*` env yo'q.
- Server kodi `import "server-only"` bilan belgilanadi. Skriptlar `tsx --conditions=react-server` bilan.
- Vercel region `fra1`.

## Buyruqlar

| Buyruq | Nima qiladi |
|---|---|
| `npm run dev` / `build` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | Bot tokeni (getMe, webhook holati) va Supabase ulanishi |
| `npm run setup` | Idempotent: `setWebhook` (secret, allowed_updates), buyruqlar, tavsiflar. `--no-webhook` bilan faqat buyruqlar |
| `npm run bot:dev` | Long polling (webhook'ni o'chiradi!) |
| `npm run probe` | Ilova O Telegram sinovi (faqat sinov boti, sinov kanali/guruhi) |

## Tuzilma

- `lib/env.ts` — env o'zgaruvchilari (yo'q bo'lsa xato, fail closed).
- `lib/telegram/bot.ts` — barcha handlerlar (`createBot`), `instance.ts` — serverless singleton.
- `lib/audit.ts` — `audit_log`ga yozish (faqat INSERT; bazada trigger UPDATE/DELETE'ni taqiqlaydi).
- `middleware.ts` — `SESSION_SECRET`/`TELEGRAM_WEBHOOK_SECRET` yo'q bo'lsa 503; ochiq bo'lmagan yo'llar `prb_session` cookie talab qiladi.
- `supabase/migrations/NNN_*.sql` — har bosqichga bitta raqamlangan migratsiya, Sancho Dashboard'ga joylaydi. `supabase/seed.sql` idempotent.

## Qoidalar

- Webhook: secret timing-safe, `tg_updates` bilan dedupe, tez 200, og'ir ish `waitUntil`da, exception tashlanmaydi.
- `callback_data` ≤ 64 bayt, faqat qisqa ID'lar; har bosishda huquq qayta tekshiriladi.
- Ko'rinish doirasi (kim nimani ko'radi) SQL ichida qo'llanadi — bot va sayt bir xil natija beradi.
- Hech narsa qattiq o'chirilmaydi: faqat arxiv.
- Foydalanuvchiga ko'rinadigan matnlar o'zbek (lotin) tilida.
- Yangi jadval qo'shilsa: RLS yoqiladi, anon/authenticated'dan revoke, service_role'ga grant.

## Qurmang (docs/CONCEPT.md, R bo'limi)

- Inline rejim (xom fayllar bilan har qanday shaklda); MVP'da Mini App.
- Sayt orqali fayl yuklash; asl fayllarni Supabase'da saqlash; lokal Bot API server, VPS, MTProto.
- Figma iframe, "anyone with link", pullik reja tasdiqlanmaguncha Figma API.
- Parol, email, Supabase Auth, Login Widget, OIDC; PromptHub admin cookie'si va boti.
- Har qanday UI'dan qattiq o'chirish (faqat arxiv); 48 soatdan eski kanal postlarini o'chirishga tayanish.
- Dizaynerlarning to'g'ridan-to'g'ri postlaridagi izohlarni qayta yozish (bot faqat o'z postlarini tahrirlaydi).
- Nomi o'xshashligiga qarab avtomatik versiya birlashtirish.
- Rasmiy hujjat oqimi, e-imzo, mehmonlar ro'yxati; vazifa menejeri, Kanban, dizaynerlar reytingi.
- AI teglash, ovozni matnga o'girish (ma'lumotlarni himoya qilish ko'rigisiz); analitika dashboardlari.
- Multi-tenant `org_id`, feature-flag katalogi, sozlanadigan tasdiqlash zanjirlari, per-asset ACL.
- `CLAUDE.md`ga yoki repoga maxfiy kalit yozish.

## Bosqichlar holati

- [ ] 0 — kod tayyor (skelet, 001_init.sql, seed, "Tez orada" landing, fail-closed middleware,
  setup/bot:dev/check/probe). Qolgani qo'lda: Supabase, Vercel + DNS, Ilova O sinovi, qarorlar
  ([`docs/DECISIONS.md`](docs/DECISIONS.md))
- [ ] 1 — bot yadrosi (F, G, I, K, M, N)
- [ ] 2 — tasdiqlash halqasi
- [ ] 3 — sayt
