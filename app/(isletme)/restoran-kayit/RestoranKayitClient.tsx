"use client";

import { useState } from "react";
import Link from "next/link";
import RestoranAuthLayout from "@/components/RestoranAuthLayout";
import TelefonGirdisi from "@/components/TelefonGirdisi";

const girdiStil =
  "w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand";
const etiketStil = "block text-sm font-medium text-foreground mb-1";

export default function RestoranKayitClient() {
  const [restoranAdi, setRestoranAdi] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [masaDuzeni, setMasaDuzeni] = useState("");
  const [menu, setMenu] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  async function basvur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!telefon) {
      setHata("Telefon zorunlu.");
      return;
    }
    setHata(null);
    setGonderiliyor(true);

    const yanit = await fetch("/api/basvuru", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restoranAdi,
        eposta,
        telefon,
        masaDuzeni: masaDuzeni || null,
        menu: menu || null,
      }),
    });

    setGonderiliyor(false);

    if (!yanit.ok) {
      const govde = await yanit.json().catch(() => ({}));
      setHata(govde.hata ?? "Başvuru gönderilemedi, tekrar deneyin.");
      return;
    }

    setGonderildi(true);
  }

  if (gonderildi) {
    return (
      <RestoranAuthLayout>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-center text-xl font-extrabold text-foreground">
          Başvurun bize ulaştı
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          En kısa sürede sana ulaşıp 10 dakikalık kurulumu birlikte yapacağız ve giriş
          bilgilerini e-postanla paylaşacağız.
        </p>
      </RestoranAuthLayout>
    );
  }

  return (
    <RestoranAuthLayout>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />
      <h1 className="mt-4 text-center text-2xl font-extrabold text-foreground">
        Restoranını Ekleyelim
      </h1>
      <p className="mt-2 text-center text-sm text-muted">Güvenlik için restoran hesapları kendiliğinden açılmıyor.</p>
      <p className="mt-1 text-center text-sm text-muted">
        Aşağıdaki formu doldur, seninle iletişime geçip giriş bilgilerini sana ulaştıralım.
      </p>

      <form method="post" onSubmit={basvur} className="mt-6 space-y-3">
        <div>
          <label className={etiketStil}>Restoran adı</label>
          <input
            value={restoranAdi}
            onChange={(e) => setRestoranAdi(e.target.value)}
            required
            maxLength={100}
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>E-posta</label>
          <input
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            type="email"
            required
            autoComplete="email"
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>Telefon</label>
          <TelefonGirdisi value={telefon} onChange={setTelefon} girdiSinifi={girdiStil} />
        </div>
        <div>
          <label className={etiketStil}>Masa düzeni (opsiyonel)</label>
          <textarea
            value={masaDuzeni}
            onChange={(e) => setMasaDuzeni(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Örn. 5 masa 4 kişilik, 3 masa 2 kişilik, bahçede 4 masa daha"
            className={girdiStil}
          />
        </div>
        <div>
          <label className={etiketStil}>Menü (opsiyonel)</label>
          <textarea
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Menü linki paylaşabilir ya da kısaca yazabilirsiniz"
            className={girdiStil}
          />
        </div>

        {hata && <p className="text-sm font-medium text-red-600">{hata}</p>}

        <button
          type="submit"
          disabled={gonderiliyor}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {gonderiliyor ? "Gönderiliyor..." : "Başvuruyu Gönder"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/restoran-girisi" className="font-semibold text-brand hover:underline">
          Giriş yap
        </Link>
      </p>
    </RestoranAuthLayout>
  );
}
