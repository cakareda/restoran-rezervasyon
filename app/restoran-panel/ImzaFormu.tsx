"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Belge = { kod: string; ad: string; url: string | null };

const girdiStil =
  "w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand";
const etiketStil = "mb-1 block text-xs font-bold uppercase tracking-wide text-muted";

export default function ImzaFormu({
  belgeler,
  baslangic,
}: {
  belgeler: Belge[];
  baslangic: { unvan: string; adres: string; eposta: string; telefon: string };
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cizimVar = useRef(false);
  const cizilirken = useRef(false);

  const [bilgiler, setBilgiler] = useState({
    unvan: baslangic.unvan,
    vergiDairesi: "",
    vergiNo: "",
    adres: baslangic.adres,
    yetkiliAd: "",
    yetkiliUnvan: "",
    telefon: baslangic.telefon,
    eposta: baslangic.eposta,
  });
  const [onaylar, setOnaylar] = useState<Record<string, boolean>>({});
  const [imzaVar, setImzaVar] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Canvas'ı yüksek çözünürlüklü ekranlarda net çizmek için ölçekle.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const oran = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * oran;
    canvas.height = rect.height * oran;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(oran, oran);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  function nokta(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function cizmeyeBasla(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    cizilirken.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = nokta(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function ciz(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!cizilirken.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = nokta(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!cizimVar.current) {
      cizimVar.current = true;
      setImzaVar(true);
    }
  }

  function cizmeyiBitir() {
    cizilirken.current = false;
  }

  function imzayiTemizle() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cizimVar.current = false;
    setImzaVar(false);
  }

  const hepsiOnayli = belgeler.every((b) => onaylar[b.kod]);
  const zorunluDolu =
    bilgiler.unvan && bilgiler.vergiDairesi && bilgiler.vergiNo && bilgiler.adres && bilgiler.yetkiliAd;
  const gonderilebilir = hepsiOnayli && zorunluDolu && imzaVar && !gonderiliyor;

  async function imzala(e: React.FormEvent) {
    e.preventDefault();
    if (!gonderilebilir) return;
    setHata(null);
    setGonderiliyor(true);

    const yanit = await fetch("/api/restoran/sozlesme-kabul", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bilgiler,
        onaylar,
        imzaGorseli: canvasRef.current!.toDataURL("image/png"),
      }),
    });
    const govde = await yanit.json().catch(() => ({}));
    setGonderiliyor(false);

    if (!yanit.ok) {
      setHata(govde.hata ?? "İmza kaydedilemedi, lütfen tekrar deneyin.");
      return;
    }
    router.refresh();
  }

  function alan(ad: keyof typeof bilgiler, etiket: string, zorunlu = false, tur = "text") {
    return (
      <label className="block">
        <span className={etiketStil}>
          {etiket}
          {zorunlu && " *"}
        </span>
        <input
          type={tur}
          value={bilgiler[ad]}
          onChange={(e) => setBilgiler((b) => ({ ...b, [ad]: e.target.value }))}
          className={girdiStil}
        />
      </label>
    );
  }

  return (
    <form onSubmit={imzala} className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Restoran (Taraf) bilgileri</h2>
        <p className="mt-1 text-xs text-muted">Sözleşmenin taraf bilgileri bu alanlardan doldurulur. * zorunlu.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {alan("unvan", "Ticari unvan / işletme adı", true)}
          {alan("vergiDairesi", "Vergi dairesi", true)}
          {alan("vergiNo", "Vergi no / T.C. kimlik no", true)}
          {alan("yetkiliAd", "Yetkili ad soyad", true)}
          {alan("yetkiliUnvan", "Yetkili unvanı")}
          {alan("telefon", "Telefon", false, "tel")}
          {alan("eposta", "E-posta", false, "email")}
          <div className="sm:col-span-2">{alan("adres", "Adres", true)}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Belgeler ve onay</h2>
        <p className="mt-1 text-xs text-muted">
          Her belgeyi açıp okuduktan sonra yanındaki kutuyu işaretle. Hepsi işaretlenmeden imza atılamaz.
        </p>
        <div className="mt-4 space-y-2.5">
          {belgeler.map((b) => (
            <label
              key={b.kod}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3.5 py-3 hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={Boolean(onaylar[b.kod])}
                onChange={(e) => setOnaylar((o) => ({ ...o, [b.kod]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-brand"
              />
              <span className="flex-1 text-sm">
                <span className="font-semibold text-foreground">{b.ad}</span>
                <span className="block text-xs text-muted">
                  Okudum, anladım ve kabul ediyorum.
                  {b.url && (
                    <>
                      {" "}
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-brand hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Belgeyi aç (PDF)
                      </a>
                    </>
                  )}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Dijital imza</h2>
        <p className="mt-1 text-xs text-muted">Aşağıdaki alana parmağınla veya fareyle imzanı çiz.</p>
        <canvas
          ref={canvasRef}
          onPointerDown={cizmeyeBasla}
          onPointerMove={ciz}
          onPointerUp={cizmeyiBitir}
          onPointerCancel={cizmeyiBitir}
          className="mt-3 h-40 w-full touch-none rounded-xl bg-zinc-50 ring-1 ring-border"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{imzaVar ? "İmza alındı." : "Henüz imza çizilmedi."}</span>
          <button type="button" onClick={imzayiTemizle} className="font-semibold text-brand hover:underline">
            İmzayı temizle
          </button>
        </div>
      </section>

      {hata && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{hata}</p>}

      <button
        type="submit"
        disabled={!gonderilebilir}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {gonderiliyor ? "İmza kaydediliyor..." : "Sözleşmeyi ve eklerini imzala"}
      </button>
      <p className="text-center text-xs text-muted">
        İmza; zaman damgası, IP adresi ve belgelerin SHA-256 karmasıyla birlikte değiştirilemez şekilde saklanır.
      </p>
    </form>
  );
}
