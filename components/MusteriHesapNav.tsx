"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MusteriHesapNav() {
  const supabase = createClient();
  const router = useRouter();
  const [adSoyad, setAdSoyad] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptalEdildi = false;

    async function yukle() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!iptalEdildi) {
          setAdSoyad(null);
          setYukleniyor(false);
        }
        return;
      }

      const { data: kullanici } = await supabase
        .from("kullanicilar")
        .select("ad_soyad")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!iptalEdildi) {
        setAdSoyad(kullanici?.ad_soyad ?? user.email ?? "Hesabım");
        setYukleniyor(false);
      }
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
    router.push("/");
    router.refresh();
  }

  if (yukleniyor) return <div className="h-9 w-24" />;

  if (adSoyad) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-foreground">Merhaba, {adSoyad.split(" ")[0]}</span>
        <button onClick={cikisYap} className="font-medium text-muted hover:text-brand-dark">
          Çıkış yap
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/hesap/giris"
      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
    >
      Giriş Yap / Kayıt Ol
    </Link>
  );
}
