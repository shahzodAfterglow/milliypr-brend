# Qarorlar jurnali

0-bosqich qabul mezonlaridan biri: [CONCEPT.md, 5-bo'lim](CONCEPT.md#5-sizdan-kerak-bolgan-6-ta-qaror)dagi
6 ta qaror shu yerda yozib qo'yiladi. Qaror o'zgarsa, avval shu fayl va `CONCEPT.md` yangilanadi, keyin kod.

Holat: ⏳ kutilmoqda · ✅ qabul qilindi · ✏️ o'zgartirib qabul qilindi

| # | Savol | Tavsiya (CONCEPT.md) | Qaror | Holat | Kim, qachon |
|---|---|---|---|---|---|
| 1 | Pullik/rasmiymi yoki bepul pilotmi? Kim yozma rozilik beradi? | 1 oylik bepul pilot, faqat maxfiy bo'lmagan materiallar, Vercel Hobby + Supabase Free. Branding boshlig'i yozma rozilik so'raydi | | ⏳ | |
| 2 | Bot va kanallar kimning akkauntida? Botning doimiy nomi? | Markazning ish akkaunti (2FA). Siz ikkinchi admin. Nomi `@milliypr_brend_bot` kabi, umrbod o'zgarmaydi | | ⏳ | |
| 3 | Pilot domeni va brend | `pr.promthub.uz`, neytral nom "PR Brend", PromptHub brendingisiz; logotip faqat yozma ruxsat bilan | | ⏳ | |
| 4 | Kim tasdiqlaydi? Rahbar Telegram'ini amalda kim yuritadi? | Yagona tasdiqlovchi — rahbar. Yordamchi ko'radi, tasdiqlay olmaydi | | ⏳ | |
| 5 | Fayllar hozir qayerda, nechta, "Restrict saving content" yoqilganmi? | Yangi arxiv kanali (bot birinchi postdan oldin admin). Eski fayllardan top-20 va joriy loyihalar import qilinadi | | ⏳ | |
| 6 | Qoralama va izohlar siyosati | Qoralamalar himoyalangan, "🔓 Himoyasiz nusxa" jurnalga yoziladi; yakuniylar erkin. Izohlar butun branding jamoasiga ko'rinadi | | ⏳ | |

## 0-bosqichda kelishiladiganlar (qarorlardan tashqari)

- [ ] Tur ro'yxati — hozircha `supabase/seed.sql`dagi 9 ta tur (taklifnoma, banner, logo, prezentatsiya, smm, bosma, stend, video, boshqa)
- [ ] Dizaynerlar uchun fayl joylash qoidasi (CONCEPT.md, 8-bo'lim)
- [ ] Rahbar eng ko'p so'raydigan 20 ta fayl ro'yxati (1-bosqich qabul sinovi shu ro'yxatda o'tadi)
- [ ] Yozma rozilik so'rovi yuborildi

## Texnik tekshiruvlar

| Sana | Tekshiruv | Natija |
|---|---|---|
| 2026-10-01 | Sinov boti `getMe` | ✅ `@npr_base_bot` (id 8621694187), inline rejim o'chiq, guruhlarga qo'shish yoqiq, privacy mode yoqiq |
| 2026-10-01 | `001_init.sql` + `seed.sql` toza Postgres 16 da (Supabase rollari taqlid qilingan) | ✅ 16 jadval; seed ikki marta — idempotent; anon/authenticated ruxsat yo'q; `audit_log` UPDATE/DELETE/TRUNCATE taqiqlangan; `K<id>` kodi trigger bilan |
| 2026-10-01 | Sinov boti `/start` (long polling, lokal PostgREST orqali) | ✅ `ADMIN_TG_IDS`dagi admin `members`ga yozildi, salomlashish keldi, `audit_log`da `start` |
| | Haqiqiy Supabase (Frankfurt) ga migratsiya | ⏳ loyiha hali ochilmagan |
| | Telegram sinovi (Ilova O), `npm run probe` | ⏳ sinov kanali va guruhi kerak |
