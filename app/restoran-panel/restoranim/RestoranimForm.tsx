"use client";

import { useCallback, useEffect, useState } from "react";
import { OLANAK_ETIKETLERI, MUTFAK_TURLERI, type Restoran, type Masa } from "@/lib/types";
import { fiyatTemizle } from "@/lib/format";
import { calismaSaatleriYikle, type CalismaSaatleri } from "@/lib/calismaSaatleri";
import OlanakIkonu from "@/components/OlanakIkonu";
import GooglePlacesArama, { type GooglePlaceSonucu } from "@/components/GooglePlacesArama";
import FotoYukleyici from "@/components/FotoYukleyici";
import MasaEnvanteri from "@/components/MasaEnvanteri";
import CalismaSaatleriDuzenleyici from "@/components/CalismaSaatleriDuzenleyici";
import RestoranOnizleme from "@/components/RestoranOnizleme";
import { restoranYolu } from "@/lib/slug";

const girdiStil =
  "w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand";
const etiketStil = "block text-sm font-medium text-foreground mb-1";

export default function RestoranimForm({
  restoran,
  kaydet,
}: {
  restoran: Restoran | null;
  kaydet: (formData: FormData) => void;
}) {
  const [ad, setAd] = useState(restoran?.ad ?? "");
  const [sehir, setSehir] = useState(restoran?.sehir ?? "");
  const [semt, setSemt] = useState(restoran?.semt ?? "");
  const [telefon, setTelefon] = useState(restoran?.telefon ?? "");
  const [adres, setAdres] = useState(restoran?.adres ?? "");
  const [mutfakTuru, setMutfakTuru] = useState(restoran?.mutfak_turu ?? "");
  const [ortalamaFiyat, setOrtalamaFiyat] = useState(fiyatTemizle(restoran?.ortalama_fiyat ?? ""));
  const [acilisSaati, setAcilisSaati] = useState(restoran?.acilis_saati?.slice(0, 5) ?? "12:00");
  const [kapanisSaati, setKapanisSaati] = useState(restoran?.kapanis_saati?.slice(0, 5) ?? "23:00");
  const [olanaklar, setOlanaklar] = useState<string[]>(restoran?.olanaklar ?? []);
  const [ozelOlanakGirdi, setOzelOlanakGirdi] = useState("");
  const [fotograflar, setFotograflar] = useState<string[]>(restoran?.fotograflar ?? []);
  const [masalar, setMasalar] = useState<Masa[]>([]);
  const hesaplananKapasite = masalar.reduce((toplam, m) => toplam + m.kapasite * m.adet, 0);
  const [calismaSaatleri, setCalismaSaatleri] = useState<CalismaSaatleri | null>(() =>
    calismaSaatleriYikle(restoran?.calisma_saatleri)
  );
  const [degisti, setDegisti] = useState(false);

  useEffect(() => {
    function ayrilmaUyarisi(e: BeforeUnloadEvent) {
      if (!degisti) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", ayrilmaUyarisi);
    return () => window.removeEventListener("beforeunload", ayrilmaUyarisi);
  }, [degisti]);

  const googleSecimUygula = useCallback((sonuc: GooglePlaceSonucu) => {
    setAd(sonuc.ad);
    setAdres(sonuc.adres);
    if (sonuc.telefon) setTelefon(sonuc.telefon);
    if (sonuc.sehir) setSehir(sonuc.sehir);
    if (sonuc.semt) setSemt(sonuc.semt);
  }, []);

  function olanakDegis(deger: string, isaretli: boolean) {
    setOlanaklar((mevcut) =>
      isaretli ? [...mevcut, deger] : mevcut.filter((o) => o !== deger)
    );
  }

  const bilinenOlanakDegerleri = OLANAK_ETIKETLERI.map((o) => o.deger) as string[];
  const ozelOlanaklar = olanaklar.filter((o) => !bilinenOlanakDegerleri.includes(o));

  function ozelOlanakEkle() {
    const deger = ozelOlanakGirdi.trim();
    if (!deger || olanaklar.includes(deger)) return;
    setOlanaklar((mevcut) => [...mevcut, deger]);
    setOzelOlanakGirdi("");
  }

  function ozelOlanakSil(deger: string) {
    setOlanaklar((mevcut) => mevcut.filter((o) => o !== deger));
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form
        action={kaydet}
        onChange={() => setDegisti(true)}
        className="h-fit max-w-lg space-y-4 rounded-2xl border border-border bg-white p-6 pb-20 shadow-sm"
      >
        <GooglePlacesArama onSecim={googleSecimUygula} />

        <div>
          <label className={etiketStil}>Restoran adı</label>
          <input
            name="ad"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            required
            className={girdiStil}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiketStil}>Şehir</label>
            <input
              name="sehir"
              value={sehir}
              onChange={(e) => setSehir(e.target.value)}
              required
              className={girdiStil}
            />
          </div>
          <div>
            <label className={etiketStil}>Semt</label>
            <input
              name="semt"
              value={semt}
              onChange={(e) => setSemt(e.target.value)}
              required
              className={girdiStil}
            />
          </div>
        </div>
        <div>
          <label className={etiketStil}>Mutfak türü</label>
          <select
            name="mutfakTuru"
            value={mutfakTuru}
            onChange={(e) => setMutfakTuru(e.target.value)}
            required
            className={girdiStil}
          >
            <option value="" disabled>
              Seçin
            </option>
            {mutfakTuru && !(MUTFAK_TURLERI as readonly string[]).includes(mutfakTuru) && (
              <option value={mutfakTuru}>{mutfakTuru}</option>
            )}
            {MUTFAK_TURLERI.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiketStil}>Bildirim e-postası</label>
            <input
              name="eposta"
              type="email"
              defaultValue={restoran?.eposta}
              required
              className={girdiStil}
            />
          </div>
          <div>
            <label className={etiketStil}>Telefon</label>
            <input
              name="telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              className={girdiStil}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiketStil}>Kapasite</label>
            <input type="hidden" name="kapasite" value={hesaplananKapasite} />
            <div className={`${girdiStil} bg-zinc-50 text-muted`}>
              {hesaplananKapasite > 0
                ? `${hesaplananKapasite} kişi (masalardan hesaplandı)`
                : "Masa ekleyince otomatik hesaplanır"}
            </div>
          </div>
          <div>
            <label className={etiketStil}>Ortalama fiyat</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted">
                ₺
              </span>
              <input
                name="ortalamaFiyat"
                value={ortalamaFiyat}
                onChange={(e) => setOrtalamaFiyat(e.target.value)}
                placeholder="örn. 500-800"
                className={`${girdiStil} pl-7`}
              />
            </div>
          </div>
        </div>
        <div>
          <label className={etiketStil}>Açıklama</label>
          <textarea
            name="aciklama"
            defaultValue={restoran?.aciklama ?? ""}
            placeholder="Restoranınız hakkında kısa açıklama"
            rows={4}
            className={girdiStil}
          />
        </div>

        <div>
          <label className={etiketStil}>Adres</label>
          <input
            name="adres"
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
            placeholder="Tam adres (haritada ve detay sayfasında gösterilir)"
            className={girdiStil}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiketStil}>Instagram linki</label>
            <input
              name="instagramUrl"
              defaultValue={restoran?.instagram_url ?? ""}
              placeholder="https://instagram.com/..."
              className={girdiStil}
            />
          </div>
          <div>
            <label className={etiketStil}>Menü linki (PDF veya sayfa)</label>
            <input
              name="menuUrl"
              defaultValue={restoran?.menu_url ?? ""}
              placeholder="https://..."
              className={girdiStil}
            />
          </div>
        </div>
        <div>
          <label className={etiketStil}>İptal politikası</label>
          <textarea
            name="iptalPolitikasi"
            defaultValue={restoran?.iptal_politikasi ?? ""}
            placeholder="Örn: Rezervasyonunuzu en az 2 saat öncesinden iptal edebilirsiniz."
            rows={2}
            className={girdiStil}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiketStil}>Açılış saati</label>
            <input
              name="acilisSaati"
              type="time"
              value={acilisSaati}
              onChange={(e) => setAcilisSaati(e.target.value)}
              required
              className={girdiStil}
            />
          </div>
          <div>
            <label className={etiketStil}>Kapanış saati</label>
            <input
              name="kapanisSaati"
              type="time"
              value={kapanisSaati}
              onChange={(e) => setKapanisSaati(e.target.value)}
              required
              className={girdiStil}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted">
          Rezervasyon saat seçenekleri bu aralığa göre gösterilir. Aşağıdan güne özel saat ya da
          kapalı gün tanımlarsan o gün için bu ayarlar geçerli olur.
        </p>

        <div>
          <label className={etiketStil}>Gün bazlı çalışma saatleri (opsiyonel)</label>
          <input type="hidden" name="calismaSaatleri" value={JSON.stringify(calismaSaatleri ?? {})} />
          <CalismaSaatleriDuzenleyici
            baslangicDeger={calismaSaatleri}
            varsayilanAcilis={acilisSaati}
            varsayilanKapanis={kapanisSaati}
            onDegis={setCalismaSaatleri}
          />
        </div>

        <div>
          <label className={etiketStil}>Oturma süresi (dakika)</label>
          <input
            name="oturmaSuresiDk"
            type="number"
            min={30}
            step={15}
            defaultValue={restoran?.oturma_suresi_dk ?? 90}
            className={girdiStil}
          />
          <p className="mt-1 text-xs text-muted">
            Bir masanın ortalama ne kadar süre işgal edildiği — müsaitlik hesabında kullanılır.
          </p>
        </div>

        <div>
          <label className={etiketStil}>Masa envanteri</label>
          <MasaEnvanteri restoranId={restoran?.id ?? null} onDegis={setMasalar} />
        </div>

        <div>
          <label className={etiketStil}>Olanaklar</label>
          <div className="grid grid-cols-2 gap-2">
            {OLANAK_ETIKETLERI.map((olanak) => (
              <label
                key={olanak.deger}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground has-[:checked]:border-brand has-[:checked]:bg-brand-light"
              >
                <input
                  type="checkbox"
                  name="olanaklar"
                  value={olanak.deger}
                  checked={olanaklar.includes(olanak.deger)}
                  onChange={(e) => olanakDegis(olanak.deger, e.target.checked)}
                  className="accent-brand"
                />
                <OlanakIkonu deger={olanak.deger} className="h-4 w-4 text-muted" />
                {olanak.etiket}
              </label>
            ))}
          </div>

          {ozelOlanaklar.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {ozelOlanaklar.map((deger) => (
                <span
                  key={deger}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-light px-3 py-1 text-sm text-brand-dark"
                >
                  {deger}
                  <button
                    type="button"
                    onClick={() => ozelOlanakSil(deger)}
                    aria-label={`${deger} olanağını kaldır`}
                    className="text-brand-dark/60 hover:text-brand-dark"
                  >
                    ×
                  </button>
                  <input type="hidden" name="olanaklar" value={deger} />
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-2">
            <input
              value={ozelOlanakGirdi}
              onChange={(e) => setOzelOlanakGirdi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ozelOlanakEkle();
                }
              }}
              type="text"
              placeholder="Kendi olanağını ekle (örn. Deniz manzarası)"
              className={girdiStil}
            />
            <button
              type="button"
              onClick={ozelOlanakEkle}
              className="shrink-0 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-brand hover:text-brand-dark"
            >
              Ekle
            </button>
          </div>
        </div>

        <div>
          <label className={etiketStil}>Fotoğraflar</label>
          <FotoYukleyici
            restoranId={restoran?.id ?? null}
            baslangicUrlleri={fotograflar}
            onDegis={setFotograflar}
          />
          <input type="hidden" name="fotograflar" value={fotograflar.join("\n")} />
        </div>

        <div className="sticky -bottom-6 -mx-6 -mb-6 flex items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-white/95 px-6 py-3 backdrop-blur">
          <p className="text-xs text-muted">
            {degisti ? "Kaydedilmemiş değişikliklerin var." : "Her şey kaydedildi."}
          </p>
          <button
            type="submit"
            onClick={() => setDegisti(false)}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Kaydet
          </button>
        </div>
      </form>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Müşteri sayfası önizlemesi
        </p>
        <RestoranOnizleme
          ad={ad}
          sehir={sehir}
          semt={semt}
          mutfakTuru={mutfakTuru}
          ortalamaFiyat={ortalamaFiyat}
          adres={adres}
          acilisSaati={acilisSaati}
          kapanisSaati={kapanisSaati}
          olanaklar={olanaklar}
          fotograflar={fotograflar}
        />

        {restoran && (
          <div className="mt-6 rounded-2xl border border-border bg-white p-4 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Sayfanı paylaş
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                `https://masadaki.com${restoranYolu(restoran)}`
              )}`}
              alt="Masadaki QR kod"
              width={140}
              height={140}
              className="mx-auto rounded-xl border border-border"
            />
            <a
              href={`https://masadaki.com${restoranYolu(restoran)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all text-xs font-semibold text-brand hover:underline"
            >
              masadaki.com{restoranYolu(restoran)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
