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

export default function BildirimZili({ restoranId }: { restoranId: string }) {
  const router = useRouter();
  const [bekleyenSayisi, setBekleyenSayisi] = useState(0);
  const [yeniGeldi, setYeniGeldi] = useState(false);
  const ilkYuklemeRef = useRef(true);

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
          if ((payload.new as { durum?: string })?.durum === "beklemede") {
            setBekleyenSayisi((n) => n + 1);
            setYeniGeldi(true);
            bildirimSesiCal();
            setTimeout(() => setYeniGeldi(false), 4000);
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
        () => sayaciYukle()
      )
      .subscribe();

    ilkYuklemeRef.current = false;

    return () => {
      iptal = true;
      supabase.removeChannel(kanal);
    };
  }, [restoranId]);

  return (
    <button
      type="button"
      onClick={() => router.push("/restoran-panel?sekme=bekleyen")}
      aria-label={bekleyenSayisi > 0 ? `${bekleyenSayisi} bekleyen rezervasyon` : "Bildirimler"}
      className={`relative text-muted transition hover:text-foreground ${
        yeniGeldi ? "animate-bounce text-brand" : ""
      }`}
    >
      <BildirimIkonu className="h-5 w-5" />
      {bekleyenSayisi > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {bekleyenSayisi > 99 ? "99+" : bekleyenSayisi}
        </span>
      )}
    </button>
  );
}
