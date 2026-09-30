import { NextResponse, type NextRequest } from "next/server";

// Fail closed: kerakli kalitlar o'rnatilmagan bo'lsa, hamma yo'l 503 qaytaradi.
// Ochiq yo'llardan tashqari hamma sahifa sessiya cookie'sini talab qiladi;
// cookie'ning haqiqiyligini server `requireMember()` bazadan tekshiradi (3-bosqich).
const PUBLIC_PATHS = ["/", "/kirish", "/maxfiylik", "/robots.txt", "/favicon.svg"];
const PUBLIC_PREFIXES = ["/api/telegram/", "/api/auth/", "/api/cron/", "/_next/"];

export function middleware(req: NextRequest) {
  if (!process.env.SESSION_SECRET || !process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!req.cookies.get("prb_session")?.value) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/kirish";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
