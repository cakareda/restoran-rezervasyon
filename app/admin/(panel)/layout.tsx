import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminMi, adminEpostalari } from "@/lib/admin";
import AdminCikisButonu from "./AdminCikisButonu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/giris");

  if (!adminMi(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf7f4] px-6">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-foreground">Yetkiniz yok</h1>
          <p className="mt-2 text-sm text-muted">
            Bu sayfa yalnızca Masadaki ekibine açık. Şu an{" "}
            <span className="font-semibold text-foreground">{user.email ?? "bilinmeyen hesap"}</span>{" "}
            ile giriş yapılmış. Yanlış hesapsa çıkış yapıp admin hesabınla tekrar dene.
          </p>
          <p className="mt-2 text-xs text-muted">
            Sunucuda tanımlı admin adresi sayısı: {adminEpostalari().length}
            {adminEpostalari().length === 0 && " — ADMIN_EPOSTALAR okunmuyor, Vercel'de redeploy gerekebilir."}
          </p>
          <div className="mt-4 text-sm font-semibold text-brand">
            <AdminCikisButonu />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f4]">
      <header className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          <span>
            <span className="block text-base font-extrabold leading-tight text-foreground">
              Masadaki
            </span>
            <span className="block text-[11px] leading-tight text-muted">Admin</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-muted">
          <Link href="/admin/basvurular" className="hover:text-brand-dark">
            Başvurular
          </Link>
          <Link href="/admin/restoranlar" className="hover:text-brand-dark">
            Restoranlar
          </Link>
          <Link href="/admin/komisyon-raporu" className="hover:text-brand-dark">
            Komisyon Raporu
          </Link>
          <Link href="/admin/sinyaller" className="hover:text-brand-dark">
            Sinyaller
          </Link>
          <AdminCikisButonu />
        </nav>
      </header>
      <main className="flex-1 px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
