"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BildirimIkonu } from "@/components/icons";

/** Web Audio API ile kısa bir "ding-ding" uyarı sesi üretir (harici dosyaya gerek yok). */
function bildirimSesiCal() {
  try {
    const AudioCtxSinifi =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxSinifi) return;
    const baglam = new AudioCtxSinifi();
    if (baglam.state === "suspended") baglam.resume().catch(() => {});

    function bipCal(frekans: number, baslangicGecikme: number) {
      const osc = baglam.createOscillator();
      const kazanc = baglam.createGain();
      osc.type = "sine";
      osc.frequency.value = frekans;
      const t0 = baglam.currentTime + baslangicGecikme;
      kazanc.gain.setValueAtTime(0.0001, t0);
      kazanc.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
      kazanc.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      osc.connect(kazanc);
      kazanc.connect(baglam.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    }
    bipCal(880, 0);
    bipCal(1175, 0.18);
  } catch {
    // Tarayıcı otomatik oynatmayı engellemiş olabilir — sessizce geç.
  }
}

type BildirimOgesi = {
  id: string;
  rezervasyonId: string;
  tur: "yeni" | "iptal";
  misafirAd: string;
  tarihSaat: string;
  olusZamani: number;
};

export default function BildirimZili({ restoranId }: { restoranId: string }) {
  const router = useRouter();
  const kutuRef = useRef<HTMLDivElement>(null);
  const [bekleyenSayisi, setBekleyenSayisi] = useState(0);
  const [yeniGeldi, setYeniGeldi] = useState(false);
  const [acik, setAcik] = useState(false);
  const [bildirimler, setBildirimler] = useState<BildirimOgesi[]>([]);
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let iptal = false;

    async function sayaciYukle() {
      const { count } = await supabase
        .from("rezervasyonlar")
        .select("id", { count: "exact", head: true })
        .eq("restoran_id", restoranId)
        .eq("durum", "beklemede");
      if (!iptal) setBekleyenSayisi(count ?? 0);
    }
    sayaciYukle();

    async function bildirimEkle(rezervasyonId: string, tur: "yeni" | "iptal") {
      const { data } = await supabase
        .from("rezervasyonlar")
        .select("tarih_saat, misafir_ad_soyad, kullanicilar(ad_soyad)")
        .eq("id", rezervasyonId)
        .maybeSingle();
      if (!data || iptal) return;

      const misafirAd =
        (data.kullanicilar as unknown as { ad_soyad: string } | null)?.ad_soyad ??
        data.misafir_ad_soyad ??
        "Bir misafir";

      setBildirimler((onceki) =>
        [
          {
            id: `${tur}-${rezervasyonId}-${Date.now()}`,
            rezervasyonId,
            tur,
            misafirAd,
            tarihSaat: data.tarih_saat,
            olusZamani: Date.now(),
          },
          ...onceki,
        ].slice(0, 15)
      );
      setOkunmamisSayisi((n) => n + 1);
      setYeniGeldi(true);
      bildirimSesiCal();
      setTimeout(() => setYeniGeldi(false), 4000);
    }

    const kanal = supabase
      .channel(`panel-bildirim-${restoranId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rezervasyonlar",
          filter: `restoran_id=eq.${restoranId}`,
        },
        (payload) => {
          const yeniKayit = payload.new as { id: string; durum?: string };
          if (yeniKayit.durum === "beklemede") {
            setBekleyenSayisi((n) => n + 1);
            bildirimEkle(yeniKayit.id, "yeni");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rezervasyonlar",
          filter: `restoran_id=eq.${restoranId}`,
        },
        (payload) => {
          sayaciYukle();
          const guncelKayit = payload.new as { id: string; durum?: string; iptal_eden?: string | null };
          // Restoranın kendi yaptığı iptal için kendine bildirim gitmesin —
          // yalnızca misafirin iptal ettiği durumları haber ver.
          if (guncelKayit.durum === "iptal_edildi" && guncelKayit.iptal_eden === "misafir") {
            bildirimEkle(guncelKayit.id, "iptal");
          }
        }
      )
      .subscribe();

    return () => {
      iptal = true;
      supabase.removeChannel(kanal);
    };
  }, [restoranId]);

  useEffect(() => {
    function disariTiklandi(e: MouseEvent) {
      if (acik && kutuRef.current && !kutuRef.current.contains(e.target as Node)) {
        setAcik(false);
      }
    }
    document.addEventListener("mousedown", disariTiklandi);
    return () => document.removeEventListener("mousedown", disariTiklandi);
  }, [acik]);

  function zileTikla() {
    setAcik((v) => !v);
    setOkunmamisSayisi(0);
  }

  function bildirimeTikla(b: BildirimOgesi) {
    setAcik(false);
    router.push(b.tur === "yeni" ? "/restoran-panel?sekme=bekleyen" : "/restoran-panel?sekme=iptal");
  }

  const toplamRozet = bekleyenSayisi + okunmamisSayisi > 0 ? bekleyenSayisi + okunmamisSayisi : bekleyenSayisi;

  return (
    <div className="relative" ref={kutuRef}>
      <button
        type="button"
        onClick={zileTikla}
        aria-label={bekleyenSayisi > 0 ? `${bekleyenSayisi} bekleyen rezervasyon` : "Bildirimler"}
        className={`relative text-muted transition hover:text-foreground ${
          yeniGeldi ? "animate-bounce text-brand" : ""
        }`}
      >
        <BildirimIkonu className="h-5 w-5" />
        {toplamRozet > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {toplamRozet > 99 ? "99+" : toplamRozet}
          </span>
        )}
      </button>

      {acik && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-border bg-white p-2 shadow-xl">
          <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-muted">Bildirimler</p>
          {bildirimler.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted">Henüz bildirim yok.</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {bildirimler.map((b) => (
                <button
                  key={b.id}
                  onClick={() => bildirimeTikla(b)}
                  className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-zinc-50"
                >
                  <span className="mt-0.5 text-base">{b.tur === "yeni" ? "🆕" : "❌"}</span>
                  <span className="flex-1">
                    <span className="block font-semibold text-foreground">
                      {b.tur === "yeni"
                        ? `${b.misafirAd} yeni rezervasyon talep etti`
                        : `${b.misafirAd} rezervasyonunu iptal etti`}
                    </span>
                    <span className="block text-xs text-muted">
                      {new Date(b.tarihSaat).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/Istanbul",
                      })}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
