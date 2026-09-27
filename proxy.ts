import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "./i18n/routing";

const dilYonlendirmesi = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/restoran-panel")) {
    return await updateSession(request);
  }
  return dilYonlendirmesi(request);
}

export const config = {
  matcher: [
    "/restoran-panel/:path*",
    "/((?!api|auth|_next|restoran-panel|restoran-girisi|restoran-kayit|restoranlar-icin|.*\\..*).*)",
  ],
};
