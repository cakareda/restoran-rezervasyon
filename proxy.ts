import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "./i18n/routing";

const dilYonlendirmesi = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/restoran-panel") ||
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    return await updateSession(request);
  }
  if (request.nextUrl.pathname.startsWith("/widget")) {
    return;
  }
  if (request.nextUrl.pathname.startsWith("/opengraph-image")) {
    return;
  }
  if (
    request.nextUrl.pathname.startsWith("/kvkk") ||
    request.nextUrl.pathname.startsWith("/cerez-politikasi") ||
    request.nextUrl.pathname.startsWith("/hakkimizda")
  ) {
    return;
  }
  return dilYonlendirmesi(request);
}

export const config = {
  matcher: [
    "/restoran-panel/:path*",
    "/((?!api|auth|_next|restoran-panel|restoran-girisi|restoran-kayit|restoranlar-icin|admin|teyit|kvkk|cerez-politikasi|hakkimizda|widget|opengraph-image|.*\\..*).*)",
  ],
};
