import type { Metadata } from "next";
import Link from "next/link";
import { SITE_ADI } from "@/lib/config";
import {
  OnayIkonu,
  TabakIkonu,
  AramaIkonu,
  GonderIkonu,
  KisiIkonu,
} from "@/components/icons";

const SAHIP_FOTO =
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=80";

export const metadata: Metadata = {
  title: "Restoranlar için",
  description:
    "Rezervasyon taleplerini tek panelden yönet, telefon trafiğini azalt. Ücretsiz kayıt ol, komisyon yok.",
};

export default function RestoranlarIcin() {
  return (
    <div>
      {/* Mini üst bar: işletme girişi/kaydı */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand-dark">
            ← {SITE_ADI}&apos;ye dön
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/restoran-girisi"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
            >
              Restoran Girişi
            </Link>
            <Link
              href="/restoran-kayit"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Restoranımı Ücretsiz Kayıt Et
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(20,8,10,0.7), rgba(20,8,10,0.35)), url(${SAHIP_FOTO})`,
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Restoranlar için
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Telefon trafiği azalsın, <span className="text-[#f0d2a8]">servise</span> odaklan.
          </h1>
          <p className="mt-3 max-w-md text-white/85">
            Rezervasyon taleplerini tek panelden yönet, misafirlerine saniyeler içinde yanıt ver.
            Kurulum ücretsiz, komisyon yok.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/restoran-kayit"
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Restoranımı Ücretsiz Kayıt Et
            </Link>
            <Link
              href="/restoran-girisi"
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Zaten hesabım var
            </Link>
          </div>
        </div>
      </section>

      {/* Faydalar */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-14 sm:grid-cols-3">
          <div>
            <GonderIkonu className="mx-auto h-6 w-6 text-brand sm:mx-0" />
            <p className="mt-2 font-bold text-foreground">Tek panelden yönet</p>
            <p className="mt-1 text-sm text-muted">
              Tüm rezervasyon taleplerini tek yerden gör, onayla veya reddet.
            </p>
          </div>
          <div>
            <OnayIkonu className="mx-auto h-6 w-6 text-brand sm:mx-0" />
            <p className="mt-2 font-bold text-foreground">Geldi/gelmedi takibi</p>
            <p className="mt-1 text-sm text-muted">
              Misafirin gelip gelmediğini işaretle, no-show&apos;ları netleştir.
            </p>
          </div>
          <div>
            <TabakIkonu className="mx-auto h-6 w-6 text-brand sm:mx-0" />
            <p className="mt-2 font-bold text-foreground">Doğrulanmış yorumlar</p>
            <p className="mt-1 text-sm text-muted">
              Yalnızca gerçekten gelmiş misafirler yorum bırakabilir.
            </p>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="mx-auto max-w-5xl px-6 py-14 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Nasıl çalışır?</p>
        <h2 className="mt-1 text-2xl font-extrabold text-foreground">Üç adımda kuruluma başla</h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              no: "01",
              Ikon: AramaIkonu,
              baslik: "Ücretsiz kayıt ol",
              aciklama: "Birkaç dakikada hesabını oluştur, restoranını ekle.",
            },
            {
              no: "02",
              Ikon: KisiIkonu,
              baslik: "Bilgilerini doldur",
              aciklama: "Çalışma saatleri, adres ve fotoğraflarını Google'dan otomatik çek.",
            },
            {
              no: "03",
              Ikon: OnayIkonu,
              baslik: "Talepleri karşıla",
              aciklama: "Gelen rezervasyon taleplerini panelinden onayla, yönet.",
            },
          ].map((adim) => (
            <div key={adim.no} className="rounded-2xl border border-border bg-white p-6 text-left">
              <p className="text-xs font-bold text-muted">{adim.no}</p>
              <adim.Ikon className="mt-2 h-6 w-6 text-brand" />
              <p className="mt-2 font-bold text-foreground">{adim.baslik}</p>
              <p className="mt-1 text-sm text-muted">{adim.aciklama}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kapanış CTA */}
      <section className="bg-brand-light py-16 text-center">
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          Restoranını bugün ekle, ilk rezervasyonunu yarın al.
        </h2>
        <Link
          href="/restoran-kayit"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Restoranımı Ücretsiz Kayıt Et
        </Link>
      </section>
    </div>
  );
}
