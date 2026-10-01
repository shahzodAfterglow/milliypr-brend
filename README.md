# PR Brend

Milliy PR markazi branding materiallari uchun ichki Telegram bot va sayt.
Konsepsiya: [`docs/CONCEPT.md`](docs/CONCEPT.md) · Claude Code uchun: [`CLAUDE.md`](CLAUDE.md).

## 0-bosqich: ishga tushirish

### Qo'lda bajariladigan qadamlar (Sancho / markaz akkaunti)

1. **Telegram** (markaz ish akkauntidan, 2FA yoqilgan):
   - Asosiy bot (`@milliypr_brend_bot` kabi) va sinov boti (hozir `@npr_base_bot`). BotFather: inline rejim **o'chiq**, "Allow groups" yoqiq.
   - Yopiq kanallar: "Brending arxivi" va "Zaxira"; yopiq guruh: "Brending jamoasi". Bot **birinchi postdan oldin** admin qilinadi
     (kanalda: post yozish va tahrirlash huquqi; guruhda: xabar yuborish, a'zolarni chiqarish).
   - Bot admin qilinganda sizga tugmalar keladi: `🗄 Arxiv kanali: Branding` / `👥 Jamoa guruhi: Branding`.
2. **Supabase**: yangi loyiha, region `eu-central-1` (Frankfurt). SQL Editor'da ketma-ket:
   `supabase/migrations/001_init.sql`, keyin `supabase/seed.sql`.
3. **Vercel**: Add New → Project → shu repo (region `fra1` — `vercel.json`da). Production Branch —
   kodning oxirgi holati turgan branch (Settings → Environments → Production → Branch Tracking).
   Env'lar — `.env.example` bo'yicha. `SESSION_SECRET` va `TELEGRAM_WEBHOOK_SECRET`ni
   (`openssl rand -hex 32`) **avval markazning parol menejeriga saqlang**, keyin Vercel'ga Sensitive
   qilib kiriting — Vercel ularni qayta ko'rsatmaydi, 5-qadamda aynan shu qiymat kerak. Ikkalasi yo'q
   bo'lsa middleware hamma sahifaga 503 qaytaradi. `APP_URL=https://pr.prompthub.uz`.
   `TELEGRAM_BOT_USERNAME` — asosiy bot nomi (build paytida o'qiladi; bo'sh bo'lsa "Botni ochish" yashiriladi).
   Env qo'shilgandan keyin Redeploy.
4. **Domen**: loyiha → Settings → Domains → `pr.prompthub.uz`. `prompthub.uz` Vercel DNS'da, yozuv va
   sertifikat avtomatik (boshqa akkaunt bo'lsa — `_vercel` TXT). `prompthub.uz/pr` qisqa havolasi
   PromptHub loyihasidagi redirect bilan ishlaydi (CONCEPT, C bo'lim).
5. **Webhook**: ishlab chiqarish qiymatlarini `.env.local`ga emas, alohida `.env.prod.local`ga yozing
   (`.env.local` sinov boti uchun qoladi), so'ng
   `set -a; . ./.env.prod.local; set +a; npm run setup && npm run check` — `check`da xato bo'lmasligi kerak.
6. Yozma rozilik so'rovi, tur ro'yxati va dizaynerlar qoidasi kelishiladi (CONCEPT 5, 8-bo'limlar).
   Javoblar [`docs/DECISIONS.md`](docs/DECISIONS.md)ga yoziladi.
7. **Telegram sinovi** (CONCEPT, Ilova O): sinov kanali va guruhiga sinov botini admin qiling, DM'dagi
   tugmalar bilan biriktiring, so'ng `npm run probe`. Natija jadvali `docs/DECISIONS.md`ga ko'chiriladi.

### Lokal ishlab chiqish

```bash
cp .env.example .env.local   # qiymatlarni to'ldiring
npm install
npm run check                 # bot va Supabase ulanishi
npm run bot:dev               # sinov boti, long polling (webhook o'rnatilgan botda ishlamaydi)
npm run probe                 # Ilova O: copyMessage, albom, reaksiya, tahrir (sinov kanalida)
npm run dev                   # sayt: http://localhost:3000
```

### Qabul mezonlari

- [ ] `pr.prompthub.uz` HTTPS bilan "Tez orada" sahifasini ko'rsatadi
- [ ] Bot `/start`ga javob beradi (admin — salomlashish, begona — muloyim rad) — sinov botida lokal baza bilan ✅, Supabase bilan ⏳
- [ ] Sinov arxiv kanaliga qo'yilgan fayl `files` jadvalida qator bo'lib paydo bo'ladi
- [ ] 6 ta qaror yozib qo'yilgan ([`docs/DECISIONS.md`](docs/DECISIONS.md))
