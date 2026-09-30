// Lokal skriptlar uchun: .env.local, keyin .env (mavjud process env ustun).
import { config } from "dotenv";
import { HttpsProxyAgent } from "https-proxy-agent";
config({ path: ".env.local" });
config({ path: ".env" });

// grammY (node-fetch) HTTPS_PROXY'ni o'zi o'qimaydi. Korporativ tarmoq yoki
// sandbox'da ishlaganda proksi agenti beriladi; Vercel'da bu fayl ishlatilmaydi.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
export const grammyClient = proxy
  ? { baseFetchConfig: { agent: new HttpsProxyAgent(proxy), compress: true } }
  : undefined;
