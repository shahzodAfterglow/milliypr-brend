import {
  Archive,
  ArrowRight,
  CheckCircle2,
  Eye,
  KeyRound,
  Lock,
  LogIn,
  Paperclip,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

// Mini landing (CONCEPT.md, 10-bo'lim). Hech qanday ichki fayl, ism yoki raqam ko'rsatilmaydi:
// o'ngdagi suhbat — shunchaki namuna.

const steps = [
  {
    icon: Upload,
    title: "Dizayner yuklaydi",
    text: "Figma'dan eksport qilingan faylni botga tashlaydi va 3 ta tugma bosadi. Versiya raqamini bot o'zi qo'yadi.",
  },
  {
    icon: Eye,
    title: "Rahbar ko'radi va tasdiqlaydi",
    text: "Bitta tugma bilan tasdiq yoki matn, ovozli izoh. Izoh aynan shu versiyaga bog'lanadi.",
  },
  {
    icon: CheckCircle2,
    title: "Hamma yakuniy versiyani oladi",
    text: "Qidiruv doim avval tasdiqlangan versiyani beradi. \"Qaysi biri oxirgisi?\" degan savol qolmaydi.",
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Qoralamalar himoyalangan",
    text: "Tasdiqlanmagan fayllarni forward qilib yoki saqlab bo'lmaydi.",
  },
  {
    icon: Archive,
    title: "Asl fayllar yopiq kanalda",
    text: "Bot faylni hajmidan qat'i nazar chatingizga o'zi yetkazadi.",
  },
  {
    icon: KeyRound,
    title: "Parolsiz kirish",
    text: "Telegram hisobingiz orqali, faqat ro'yxatdagi xodimlar uchun.",
  },
];

export default function Home() {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[32rem] w-[56rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-[0.12] blur-3xl dark:opacity-[0.18]"
      />

      <header className="container relative flex h-16 max-w-6xl items-center justify-between">
        <span className="flex items-center gap-2.5 font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7" />
          PR Brend
        </span>
        <ThemeToggle />
      </header>

      <main className="container relative max-w-6xl flex-1">
        <section className="grid items-center gap-12 py-10 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="animate-fade-up motion-reduce:animate-none">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Tez orada · ichki tizim
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Brend materiallari — bitta joyda,{" "}
              <span className="text-brand-gradient">doim oxirgi versiyasi</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Taklifnoma, banner, logotip va prezentatsiyalarning yakuniy fayli Telegram botda 2–3
              bosishda. Dizaynerlar yuklaydi, rahbar tasdiqlaydi, hamma faqat tasdiqlangan
              versiyani oladi.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {botUsername && (
                <Button asChild variant="gradient" size="lg" className="h-12 rounded-full px-7 text-base">
                  <a href={`https://t.me/${botUsername}`} rel="noopener noreferrer">
                    <Send className="mr-2 h-4 w-4" aria-hidden />
                    Botni ochish
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-full px-7 text-base"
                disabled
                aria-describedby="login-soon"
              >
                <LogIn className="mr-2 h-4 w-4" aria-hidden />
                Telegram orqali kirish
                <span
                  id="login-soon"
                  className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  tez orada
                </span>
              </Button>
            </div>

            <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Kirish faqat taklif qilingan xodimlar uchun. Parol yo&apos;q — Telegram hisobingiz orqali.
            </p>
          </div>

          <ChatSample />
        </section>

        <section aria-labelledby="how" className="py-12 sm:py-16">
          <h2 id="how" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Qanday ishlaydi
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="group relative animate-fade-up rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 motion-reduce:animate-none"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground/70">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                {i < steps.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="absolute -right-[1.15rem] top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-background text-muted-foreground sm:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Tamoyillar" className="pb-16 sm:pb-24">
          <div className="grid gap-6 rounded-2xl border border-border/60 bg-muted/40 p-6 sm:grid-cols-3 sm:p-8">
            {principles.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border/60">
        <div className="container flex max-w-6xl flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>PR Brend — brend materiallari uchun ichki tizim</span>
          <span>Fayllar sayt orqali o&apos;tmaydi</span>
        </div>
      </footer>
    </div>
  );
}

// Bot bilan suhbatning namunasi (bezak, ekran o'quvchilardan yashirilgan).
function ChatSample() {
  return (
    <figure
      aria-hidden
      className="relative mx-auto w-full max-w-sm animate-fade-up motion-reduce:animate-none lg:mx-0 lg:ml-auto"
      style={{ animationDelay: "160ms" }}
    >
      <div className="rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white dark:text-primary-foreground">
            P
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">PR Brend</p>
            <p className="text-xs text-muted-foreground">bot</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 text-sm">
          <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground">
            navro&apos;z taklifnoma
          </div>

          <div className="w-[88%] overflow-hidden rounded-2xl rounded-bl-md border border-border/60 bg-background">
            <div className="relative flex h-32 items-end bg-brand-gradient p-3">
              <div className="space-y-1.5">
                <div className="h-2 w-24 rounded-full bg-white/80" />
                <div className="h-2 w-16 rounded-full bg-white/60" />
              </div>
              <span className="absolute right-2.5 top-2.5 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                ✅ Yakuniy
              </span>
            </div>
            <div className="p-3">
              <p className="font-medium">Taklifnoma (UZ)</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Tasdiqlangan versiya · forward mumkin</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium">
                <span className="flex items-center justify-center gap-1 rounded-lg bg-muted py-1.5">
                  <Paperclip className="h-3 w-3" /> Faylni olish
                </span>
                <span className="flex items-center justify-center rounded-lg bg-muted py-1.5">Versiyalar</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            Jamoa guruhida: 👀 Rahbar ko&apos;rdi → ✅ Tasdiqlandi
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">Namuna</figcaption>
    </figure>
  );
}
