"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SaatIkonu } from "@/components/icons";

function saatListesiUret() {
  const liste: string[] = [];
  for (let dk = 0; dk < 24 * 60; dk += 30) {
    const saat = String(Math.floor(dk / 60)).padStart(2, "0");
    const dakika = String(dk % 60).padStart(2, "0");
    liste.push(`${saat}:${dakika}`);
  }
  return liste;
}

export default function SaatSecici({
  name,
  defaultValue,
  etiket,
  varyant = "pill",
}: {
  name: string;
  defaultValue?: string;
  etiket: string;
  varyant?: "pill" | "duz";
}) {
  const [deger, setDeger] = useState(defaultValue ?? "");
  const [acik, setAcik] = useState(false);
  const kapsayiciRef = useRef<HTMLDivElement>(null);
  const saatler = useMemo(saatListesiUret, []);

  useEffect(() => {
    function disariTikla(e: MouseEvent) {
      if (kapsayiciRef.current && !kapsayiciRef.current.contains(e.target as Node)) {
        setAcik(false);
      }
    }
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  return (
    <div ref={kapsayiciRef} className="relative flex-1">
      <input type="hidden" name={name} value={deger} />
      {varyant === "pill" ? (
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <SaatIkonu className="h-4 w-4 shrink-0 text-muted" />
          <span className="flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
              {etiket}
            </span>
            <span className="block text-sm font-semibold text-foreground">{deger || "--:--"}</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          className="w-full px-4 py-2.5 text-left"
        >
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <SaatIkonu className="h-3 w-3" /> {etiket}
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-foreground">
            {deger || "--:--"}
          </span>
        </button>
      )}

      {acik && (
        <div className="absolute z-20 mt-2 grid max-h-64 w-60 grid-cols-3 gap-1.5 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-lg">
          {saatler.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setDeger(s);
                setAcik(false);
              }}
              className={`rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                deger === s
                  ? "bg-brand text-white"
                  : "bg-brand-light text-brand-dark hover:bg-orange-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
