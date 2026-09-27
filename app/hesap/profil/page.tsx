import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { RezervasyonDurum } from "@/lib/types";
import { TakvimIkonu } from "@/components/icons";

const durumEtiketi: Record<RezervasyonDurum, string> = {
  beklemede: "Beklemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  iptal_edildi: "İptal edildi",
};

const durumStil: Record<RezervasyonDurum, string> = {
  beklemede: "bg-amber-50 text-amber-700",
  onaylandi: "bg-green-50 text-green-700",
  reddedildi: "bg-red-50 text-red-700",
  iptal_edildi: "bg-zinc-100 text-zinc-500",
};

async function kaydet(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("kullanicilar")
    .update({
      ad_soyad: String(formData.get("adSoyad")),
      telefon: String(formData.get("telefon") ?? "") || null,
    })
    .eq("auth_user_id", user.id);

  revalidatePath("/hesap/profil");
  redirect(error ? "/hesap/profil?hata=1" : "/hesap/profil?kaydedildi=1");
}

export default async function Profilim({
  searchParams,
}: {
  searchParams: Promise<{ kaydedildi?: string; hata?: string }>;
}) {
  const { kaydedildi, hata } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/hesap/giris");

  const { data: kullanici } = await supabase
    .from("kullanicilar")
    .select("id, ad_soyad, eposta, telefon")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!kullanici) redirect("/hesap/giris");

  const { data: rezervasyonlar } = await supabase
    .from("rezervasyonlar")
    .select("id, tarih_saat, kisi_sayisi, durum, restoran_id, restoranlar(ad, sehir, semt)")
    .eq("kullanici_id", kullanici.id)
    .order("tarih_saat", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-foreground">Profilim</h1>
      <p className="mt-1 text-sm text-muted">Bilgilerini güncelle, rezervasyonlarını gör.</p>

      {kaydedildi && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          ✓ Kaydedildi.
        </p>
      )}
      {hata && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          Kaydedilemedi, tekrar deneyin.
        </p>
      )}

      <form action={kaydet} className="mt-6 space-y-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Ad Soyad</span>
          <input
            name="adSoyad"
            type="text"
            required
            defaultValue={kullanici.ad_soyad}
            className="mt-1 w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">E-posta</span>
          <input
            type="email"
            disabled
            defaultValue={kullanici.eposta}
            className="mt-1 w-full rounded-xl border-0 bg-zinc-50 px-3.5 py-2.5 text-sm text-muted outline-none ring-1 ring-border"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Telefon</span>
          <input
            name="telefon"
            type="tel"
            defaultValue={kullanici.telefon ?? ""}
            placeholder="Opsiyonel"
            className="mt-1 w-full rounded-xl border-0 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Kaydet
        </button>
      </form>

      <h2 className="mt-10 text-lg font-bold text-foreground">Rezervasyonlarım</h2>
      <div className="mt-4 space-y-3">
        {!rezervasyonlar || rezervasyonlar.length === 0 ? (
          <p className="text-sm text-muted">Henüz bir rezervasyonun yok.</p>
        ) : (
          rezervasyonlar.map((r) => {
            const restoran = Array.isArray(r.restoranlar) ? r.restoranlar[0] : r.restoranlar;
            const durum = r.durum as RezervasyonDurum;
            const aktifMi = durum !== "iptal_edildi" && durum !== "reddedildi";
            const gelecekMi = new Date(r.tarih_saat) > new Date();
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">{restoran?.ad ?? "Restoran"}</p>
                    <p className="text-sm text-muted">
                      {restoran?.semt}, {restoran?.sehir}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <TakvimIkonu className="h-4 w-4 text-muted" />
                      {new Date(r.tarih_saat).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {r.kisi_sayisi} kişi
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${durumStil[durum]}`}>
                    {durumEtiketi[durum]}
                  </span>
                </div>
                {aktifMi && gelecekMi && (
                  <div className="mt-3 flex gap-4 border-t border-border pt-3">
                    <Link
                      href={`/rezervasyon/${r.id}/iptal?degistir=1`}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Değiştir
                    </Link>
                    <Link
                      href={`/rezervasyon/${r.id}/iptal`}
                      className="text-sm font-semibold text-muted hover:text-red-600"
                    >
                      İptal Et
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
