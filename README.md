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
3. **Vercel**: yangi loyiha shu repodan, region `fra1`. Env'lar — `.env.example` bo'yicha (Sensitive).
4. **DNS** (webname.uz): `pr` → CNAME → Vercel ko'rsatgan target. Vercel'da domen qo'shiladi.
5. **Webhook**: `.env.local`da ishlab chiqarish qiymatlari bilan `npm run setup`.
6. Yozma rozilik so'rovi, tur ro'yxati va dizaynerlar qoidasi kelishiladi (CONCEPT 5, 8-bo'limlar).

### Lokal ishlab chiqish

```bash
cp .env.example .env.local   # qiymatlarni to'ldiring
npm install
npm run check                 # bot va Supabase ulanishi
npm run bot:dev               # sinov boti, long polling
npm run dev                   # sayt: http://localhost:3000
```

### Qabul mezonlari

- [ ] `pr.promthub.uz` HTTPS bilan "Tez orada" sahifasini ko'rsatadi
- [ ] Bot `/start`ga javob beradi (admin — salomlashish, begona — muloyim rad)
- [ ] Sinov arxiv kanaliga qo'yilgan fayl `files` jadvalida qator bo'lib paydo bo'ladi
- [ ] 6 ta qaror yozib qo'yilgan
