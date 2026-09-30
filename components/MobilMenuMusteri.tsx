"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { MenuIkonu, KapatIkonu } from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function MobilMenuMusteri({
  restoranlarMetni,
  nasilCalisirMetni,
  girisKayitMetni,
  isletmeSahibiyimMetni,
}: {
  restoranlarMetni: string;
  nasilCalisirMetni: string;
  girisKayitMetni: string;
  isletmeSahibiyimMetni: string;
}) {
  const t = useTranslations("SiteNav");
  const supabase = createClient();
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [adSoyad, setAdSoyad] = useState<string | null>(null);

  useEffect(() => {
    let iptalEdildi = false;

    async function yukle() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!iptalEdildi) setAdSoyad(null);
        return;
      }

      const { data: kullanici } = await supabase
        .from("kullanicilar")
        .select("ad_soyad")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!iptalEdildi) setAdSoyad(kullanici?.ad_soyad ?? null);
    }

    yukle();
    const { data: dinleyici } = supabase.auth.onAuthStateChange(() => yukle());

    return () => {
      iptalEdildi = true;
      dinleyici.subscription.unsubscribe();
    };
  }, [supabase]);

  async function cikisYap() {
    await supabase.auth.signOut();
    setAcik(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setAcik(true)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center text-foreground"
      >
        <MenuIkonu className="h-6 w-6" />
      </button>

      {acik && (
        <>
          <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setAcik(false)} />
          <div className="fixed top-0 right-0 z-30 flex h-screen w-72 max-w-[80%] flex-col overflow-y-auto bg-background p-6 shadow-xl">
            <button
              onClick={() => setAcik(false)}
              aria-label="Close"
              className="ml-auto flex h-9 w-9 items-center justify-center text-foreground"
            >
              <KapatIkonu className="h-6 w-6" />
            </button>

            <div className="mt-4">
              <LanguageSwitcher />
            </div>

            <nav className="mt-4 flex flex-col gap-1 text-base font-medium text-foreground">
              <Link
                href="/restoranlar"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                {restoranlarMetni}
              </Link>
              <Link
                href="/#nasil-calisir"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                {nasilCalisirMetni}
              </Link>
              <div className="my-2 border-t border-border" />
              {adSoyad ? (
                <>
                  <Link
                    href="/hesap/profil"
                    onClick={() => setAcik(false)}
                    className="rounded-lg px-3 py-3 hover:bg-brand-light"
                  >
                    {t("merhaba")} {adSoyad.split(" ")[0]}
                  </Link>
                  <button
                    onClick={cikisYap}
                    className="rounded-lg px-3 py-3 text-left hover:bg-brand-light"
                  >
                    {t("cikisYap")}
                  </button>
                </>
              ) : (
                <Link
                  href="/hesap/giris"
                  onClick={() => setAcik(false)}
                  className="rounded-lg px-3 py-3 hover:bg-brand-light"
                >
                  {girisKayitMetni}
                </Link>
              )}
              <div className="my-2 border-t border-border" />
              <NextLink
                href="/restoranlar-icin"
                onClick={() => setAcik(false)}
                className="rounded-lg px-3 py-3 hover:bg-brand-light"
              >
                {isletmeSahibiyimMetni}
              </NextLink>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
