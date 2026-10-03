"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MASA_ALANLARI,
  OZEL_GUN_SECENEKLERI,
  type RezervasyonDurum,
  type RezervasyonKaynagi,
} from "@/lib/types";
import { DIL_ADLARI } from "@/i18n/routing";
import { TakvimIkonu, TelefonIkonu, WhatsappIkonu } from "@/components/icons";
import { whatsappNumarasi } from "@/lib/format";

const kaynakEtiketi: Record<RezervasyonKaynagi, string> = {
  online: "Online",
  telefon: "Telefon",
};

const durumEtiketi: Record<RezervasyonDurum, string> = {
  beklemede: "Beklemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  iptal_edildi: "Misafir iptal etti",
};

const durumStil: Record<RezervasyonDurum, string> = {
  beklemede: "bg-amber-50 text-amber-700",
  onaylandi: "bg-green-50 text-green-700",
  reddedildi: "bg-red-50 text-red-700",
  iptal_edildi: "bg-zinc-100 text-zinc-500",
};

export default function RezervasyonSatiri({
  id,
  misafirAd,
  misafirEposta,
  misafirTelefon,
  misafirDili,
  kaynak,
  tarihSaat,
  kisiSayisi,
  durum,
  geldiMi,
  notlar,
  restoranNotu,
  hayaletUyarisi,
  alanTercihi,
  ozelGun,
  grupUyarisi,
  misafirTeyit,
  atananMasaIdler,
  masalar,
}: {
  id: string;
  misafirAd: string;
  misafirEposta: string;
  misafirTelefon?: string;
  misafirDili?: string | null;
  kaynak: RezervasyonKaynagi;
  tarihSaat: string;
  kisiSayisi: number;
  durum: RezervasyonDurum;
  geldiMi: boolean | null;
  notlar?: string | null;
  restoranNotu?: string | null;
  hayaletUyarisi?: boolean;
  alanTercihi?: string | null;
  ozelGun?: string | null;
  grupUyarisi?: boolean;
  misafirTeyit?: boolean | null;
  atananMasaIdler?: string[] | null;
  masalar?: { id: string; isim: string; kapasite: number; alan: string }[];
}) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [notDuzenleniyor, setNotDuzenleniyor] = useState(false);
  const [notMetni, setNotMetni] = useState(restoranNotu ?? "");
  const [notKaydediliyor, setNotKaydediliyor] = useState(false);
  const [onayModali, setOnayModali] = useState<{
    baslik: string;
    url: string;
  } | null>(null);
  const [masaModaliAcik, setMasaModaliAcik] = useState(false);
  const [seciliMasaIdler, setSeciliMasaIdler] = useState<string[]>(atananMasaIdler ?? []);

  async function notuKaydet() {
    setNotKaydediliyor(true);
    await fetch(`/api/rezervasyon/${id}/restoran-notu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ not: notMetni }),
    });
    setNotKaydediliyor(false);
    setNotDuzenleniyor(false);
    router.refresh();
  }

  const seciliKapasite = (masalar ?? [])
    .filter((m) => seciliMasaIdler.includes(m.id))
    .reduce((t, m) => t + m.kapasite, 0);

  function masaSecimiDegistir(masaId: string) {
    setSeciliMasaIdler((onceki) =>
      onceki.includes(masaId) ? onceki.filter((x) => x !== masaId) : [...onceki, masaId]
    );
  }

  async function masaAtaKaydet() {
    setYukleniyor(true);
    await fetch(`/api/rezervasyon/${id}/masa-ata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masaIdler: seciliMasaIdler }),
    });
    setYukleniyor(false);
    setMasaModaliAcik(false);
    router.refresh();
  }

  async function eylemCagir(url: string, gövde?: object) {
    setYukleniyor(true);
    const yanit = await fetch(url, {
      method: "POST",
      headers: gövde ? { "Content-Type": "application/json" } : undefined,
      body: gövde ? JSON.stringify(gövde) : undefined,
    });
    setYukleniyor(false);
    if (!yanit.ok) {
      const gövdeYanit = await yanit.json().catch(() => null);
      alert(gövdeYanit?.hata ?? "Bir şeyler ters gitti, tekrar dene.");
      return;
    }
    setOnayModali(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 font-bold text-foreground">
            {misafirAd}
            {hayaletUyarisi && (
              <span
                title="Bu misafir daha önce en az 2 kez gelmedi"
                className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
              >
                👻 Sık gelmiyor
              </span>
            )}
            {misafirDili && misafirDili !== "tr" && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {DIL_ADLARI[misafirDili as keyof typeof DIL_ADLARI] ?? misafirDili}
              </span>
            )}
            {grupUyarisi && (
              <span
                title="Bu rezervasyon grup eşiğinin üzerinde"
                className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700"
              >
                👥 Grup
              </span>
            )}
          </p>
          <p className="text-sm text-muted">{misafirEposta || misafirTelefon}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <TakvimIkonu className="h-4 w-4 text-muted" />
            {new Date(tarihSaat).toLocaleString("tr-TR", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Europe/Istanbul",
            })}{" "}
            · {kisiSayisi} kişi
            {alanTercihi && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                {MASA_ALANLARI.find((a) => a.deger === alanTercihi)?.etiket ?? alanTercihi} tercih ediyor
              </span>
            )}
          </p>
          {ozelGun && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
              🎉 {OZEL_GUN_SECENEKLERI.find((o) => o.deger === ozelGun)?.etiket ?? ozelGun}
            </p>
          )}
          {notlar && (
            <p className="mt-2 inline-flex max-w-md items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
              📝 {notlar}
            </p>
          )}

          {notDuzenleniyor ? (
            <div className="mt-2 flex max-w-md items-center gap-1.5">
              <input
                value={notMetni}
                onChange={(e) => setNotMetni(e.target.value)}
                maxLength={300}
                placeholder="Restoran notu (yalnızca size görünür)"
                className="w-full rounded-lg border-0 px-2.5 py-1.5 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
              />
              <button
                onClick={notuKaydet}
                disabled={notKaydediliyor}
                className="shrink-0 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          ) : restoranNotu ? (
            <button
              onClick={() => setNotDuzenleniyor(true)}
              className="mt-2 inline-flex max-w-md items-start gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-left text-xs font-medium text-blue-800 hover:bg-blue-100"
            >
              🔒 {restoranNotu}
            </button>
          ) : (
            <button
              onClick={() => setNotDuzenleniyor(true)}
              className="mt-2 text-xs font-semibold text-muted hover:text-brand-dark"
            >
              + Not ekle
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
            {kaynakEtiketi[kaynak]}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${durumStil[durum]}`}>
            {durumEtiketi[durum]}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {durum === "beklemede" && (
          <>
            <button
              disabled={yukleniyor}
              onClick={() => eylemCagir(`/api/rezervasyon/${id}/onayla`)}
              className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Onayla
            </button>
            <button
              disabled={yukleniyor}
              onClick={() =>
                setOnayModali({
                  baslik: "Bu rezervasyon talebini reddetmek istediğine emin misin?",
                  url: `/api/rezervasyon/${id}/reddet`,
                })
              }
              className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50 disabled:opacity-50"
            >
              Reddet
            </button>
          </>
        )}
        {misafirTelefon && (
          <>
            <a
              href={`tel:${misafirTelefon}`}
              aria-label="Misafiri ara"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-zinc-50"
            >
              <TelefonIkonu className="h-4 w-4" />
            </a>
            <a
              href={`https://wa.me/${whatsappNumarasi(misafirTelefon)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp'tan yaz"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-green-600 hover:bg-green-50"
            >
              <WhatsappIkonu className="h-4 w-4" />
            </a>
          </>
        )}

        {durum === "onaylandi" && geldiMi === null && (
          <>
            <button
              disabled={yukleniyor}
              onClick={() =>
                eylemCagir(`/api/rezervasyon/${id}/gelis-durumu`, { geldiMi: true })
              }
              className="rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Geldi
            </button>
            <button
              disabled={yukleniyor}
              onClick={() =>
                eylemCagir(`/api/rezervasyon/${id}/gelis-durumu`, { geldiMi: false })
              }
              className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50 disabled:opacity-50"
            >
              Gelmedi
            </button>
          </>
        )}

        {durum === "onaylandi" && geldiMi !== null && (
          <span className="flex items-center gap-2 text-sm text-muted">
            {geldiMi ? "✓ Misafir geldi" : "✗ Misafir gelmedi"}
            <button
              disabled={yukleniyor}
              onClick={() => eylemCagir(`/api/rezervasyon/${id}/gelis-durumu`, { geldiMi: null })}
              className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
            >
              Geri al
            </button>
          </span>
        )}

        {geldiMi === true && misafirTeyit === false && (
          <span
            title="Misafir, geldiğini onaylamadı — komisyon itirazına açık, incele."
            className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
          >
            ⚠️ Misafir onaylamadı
          </span>
        )}
        {geldiMi === false && misafirTeyit === true && (
          <span
            title="Misafir gittiğini bildirdi — No-Show kaydı Masadaki tarafından incelenebilir."
            className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
          >
            ⚠️ Misafir gittiğini bildirdi
          </span>
        )}
        {geldiMi === true && misafirTeyit === true && (
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            ✓ Misafir onayladı
          </span>
        )}

        {durum === "onaylandi" && (
          <button
            disabled={yukleniyor}
            onClick={() =>
              setOnayModali({
                baslik: "Bu rezervasyonu iptal etmek istediğine emin misin? Misafire e-posta gidecek.",
                url: `/api/rezervasyon/${id}/restoran-iptal`,
              })
            }
            className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            İptal Et
          </button>
        )}

        {durum === "onaylandi" && masalar && masalar.length > 0 && (
          <button
            onClick={() => setMasaModaliAcik(true)}
            className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50"
          >
            {atananMasaIdler && atananMasaIdler.length > 0
              ? `Masa: ${atananMasaIdler
                  .map((mid) => masalar.find((m) => m.id === mid)?.isim ?? "?")
                  .join(" + ")}`
              : "Masa ata"}
          </button>
        )}
      </div>

      {masaModaliAcik && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setMasaModaliAcik(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground">Masa ata</p>
            <p className="mt-1 text-xs text-muted">
              Birden fazla masa seçersen birleştirilmiş sayılır ({kisiSayisi} kişi gerekiyor).
            </p>
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {(masalar ?? []).map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={seciliMasaIdler.includes(m.id)}
                    onChange={() => masaSecimiDegistir(m.id)}
                  />
                  {m.isim} — {m.kapasite} kişi{m.alan && ` · ${m.alan}`}
                </label>
              ))}
            </div>
            <p
              className={`mt-2 text-xs font-semibold ${
                seciliKapasite < kisiSayisi ? "text-red-600" : "text-green-600"
              }`}
            >
              Toplam kapasite: {seciliKapasite} kişi
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setMasaModaliAcik(false)}
                className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50"
              >
                Vazgeç
              </button>
              <button
                disabled={yukleniyor || (seciliMasaIdler.length > 0 && seciliKapasite < kisiSayisi)}
                onClick={masaAtaKaydet}
                className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {onayModali && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOnayModali(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-foreground">{onayModali.baslik}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOnayModali(null)}
                className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground hover:bg-zinc-50"
              >
                Vazgeç
              </button>
              <button
                disabled={yukleniyor}
                onClick={() => eylemCagir(onayModali.url)}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Evet, onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
