import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Eye, CheckCircle2, Send } from "lucide-react";

const steps = [
  { icon: Upload, title: "Dizayner yuklaydi", text: "Faylni botga tashlaydi — versiya raqamini bot o'zi qo'yadi." },
  { icon: Eye, title: "Rahbar ko'radi va tasdiqlaydi", text: "Bitta tugma bilan tasdiq yoki matn, ovozli izoh." },
  { icon: CheckCircle2, title: "Hamma yakuniy versiyani oladi", text: "Qidiruv doim avval tasdiqlangan versiyani beradi." },
];

export default function Home() {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  return (
    <main className="container flex min-h-screen max-w-3xl flex-col justify-center py-16">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        PR Brend · Tez orada
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl animate-fade-up">
        Brend materiallari — bitta joyda, doim oxirgi versiyasi
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Ichki tizim hozir tayyorlanmoqda. Kirish faqat taklif qilingan xodimlar uchun.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <Card key={title} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {botUsername && (
          <Button asChild size="lg">
            <a href={`https://t.me/${botUsername}`} rel="noopener noreferrer">
              <Send className="mr-2 h-4 w-4" aria-hidden />
              Botni ochish
            </a>
          </Button>
        )}
        <Button size="lg" variant="outline" disabled title="3-bosqichda ishga tushadi">
          Telegram orqali kirish
        </Button>
      </div>
    </main>
  );
}
