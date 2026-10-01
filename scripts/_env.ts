// Lokal skriptlar uchun: .env.local, keyin .env (mavjud process env ustun).
// ENV_FILE berilsa (masalan, ishlab chiqarish setup'i: ENV_FILE=.env.prod.local), faqat shu fayl
// o'qiladi va u process env'dan ham ustun turadi — sinov qiymatlari aralashib ketmaydi.
import { config } from "dotenv";
import { HttpsProxyAgent } from "https-proxy-agent";

const envFile = process.env.ENV_FILE;
if (envFile) {
  const loaded = config({ path: envFile, override: true });
  if (loaded.error) throw new Error(`ENV_FILE o'qilmadi: ${envFile}`);
  // Token fayldan kelishi shart: aks holda shell'dagi (sinov) tokeni bilan ishlab ketadi.
  if (!loaded.parsed?.TELEGRAM_BOT_TOKEN) throw new Error(`${envFile} ichida TELEGRAM_BOT_TOKEN yo'q`);
} else {
  config({ path: ".env.local" });
  config({ path: ".env" });
}

// grammY (node-fetch) HTTPS_PROXY'ni o'zi o'qimaydi. Korporativ tarmoq yoki
// sandbox'da ishlaganda proksi agenti beriladi; Vercel'da bu fayl ishlatilmaydi.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
export const grammyClient = proxy
  ? { baseFetchConfig: { agent: new HttpsProxyAgent(proxy), compress: true } }
  : undefined;
