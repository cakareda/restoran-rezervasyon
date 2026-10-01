import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RestoranimForm from "./RestoranimForm";
import UrlTemizle from "@/components/UrlTemizle";

export const metadata: Metadata = { title: "Restoranım" };

async function kaydet(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Güvenlik: restoran hesapları artık kendiliğinden açılmıyor, biz oluşturuyoruz.
  // Bu yüzden burada "oluşturma" değil sadece "düzenleme" izinliyiz — aksi halde
  // herhangi bir (örn. misafir) hesap, panele gelip rastgele bir restoran adı girip
  // kendine yeni bir restoran profili açabilirdi.
  const { data: mevcutRestoran } = await supabase
    .from("restoranlar")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!mevcutRestoran) {
    redirect("/restoran-panel/restoranim?hata=yetkisiz");
  }

  const olanaklar = formData
    .getAll("olanaklar")
    .map((deger) => String(deger).trim())
    .filter(Boolean);

  const fotograflar = String(formData.get("fotograflar") ?? "")
    .split("\n")
    .map((satir) => satir.trim())
    .filter(Boolean);

  const calismaSaatleriHam = String(formData.get("calismaSaatleri") ?? "{}");
  const calismaSaatleriGecerli =
    calismaSaatleriHam !== "{}" && calismaSaatleriHam.trim() !== "" ? calismaSaatleriHam : null;

  const ozelGunlerHam = String(formData.get("ozelGunler") ?? "[]");
  const ozelGunlerGecerli = ozelGunlerHam !== "[]" && ozelGunlerHam.trim() !== "" ? ozelGunlerHam : null;

  const fiyatSeviyesiHam = formData.get("fiyatSeviyesi");
  const fiyatSeviyesi =
    fiyatSeviyesiHam && String(fiyatSeviyesiHam).trim() !== "" ? Number(fiyatSeviyesiHam) : null;

  const { error } = await supabase.from("restoranlar").upsert(
    {
      auth_user_id: user.id,
      ad: String(formData.get("ad")).slice(0, 100),
      sehir: String(formData.get("sehir")),
      semt: String(formData.get("semt")),
      mutfak_turu: String(formData.get("mutfakTuru")),
      eposta: String(formData.get("eposta")),
      telefon: String(formData.get("telefon") ?? ""),
      kapasite: formData.get("kapasite") ? Number(formData.get("kapasite")) : null,
      ortalama_fiyat: String(formData.get("ortalamaFiyat") ?? ""),
      fiyat_seviyesi: fiyatSeviyesi,
      aciklama: String(formData.get("aciklama") ?? "").slice(0, 600),
      adres: String(formData.get("adres") ?? ""),
      acilis_saati: String(formData.get("acilisSaati") ?? "12:00"),
      kapanis_saati: String(formData.get("kapanisSaati") ?? "23:00"),
      calisma_saatleri: calismaSaatleriGecerli,
      ozel_gunler: ozelGunlerGecerli,
      instagram_url: String(formData.get("instagramUrl") ?? "").trim() || null,
      menu_url: String(formData.get("menuUrl") ?? "").trim() || null,
      iptal_politikasi: String(formData.get("iptalPolitikasi") ?? "").trim().slice(0, 300) || null,
      duyuru: String(formData.get("duyuru") ?? "").trim().slice(0, 140) || null,
      lat: formData.get("lat") ? Number(formData.get("lat")) : null,
      lng: formData.get("lng") ? Number(formData.get("lng")) : null,
      oturma_suresi_dk: formData.get("oturmaSuresiDk")
        ? Math.min(480, Math.max(30, Number(formData.get("oturmaSuresiDk"))))
        : 90,
      olanaklar,
      fotograflar,
    },
    { onConflict: "auth_user_id" }
  );

  revalidatePath("/restoran-panel/restoranim");
  revalidatePath("/restoran-panel");
  revalidatePath("/");

  redirect(error ? "/restoran-panel/restoranim?hata=1" : "/restoran-panel/restoranim?kaydedildi=1");
}

export default async function Restoranim({
  searchParams,
}: {
  searchParams: Promise<{ kaydedildi?: string; hata?: string }>;
}) {
  const { kaydedildi, hata } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select("*")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  const { data: tumRestoranlar } = await supabase.from("restoranlar").select("semt");
  const semtSecenekleri = Array.from(
    new Set((tumRestoranlar ?? []).map((r) => r.semt).filter(Boolean))
  ).sort();

  if (!restoran) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Restoranım</h1>
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">
          Bu hesap için henüz bir restoran profili oluşturulmamış. Güvenlik nedeniyle restoran
          profilleri kendiliğinden açılmıyor —{" "}
          <a href="mailto:info@masadaki.com" className="font-semibold text-brand hover:underline">
            info@masadaki.com
          </a>{" "}
          adresinden bize ulaşın, kurulumu birlikte yapalım.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Restoranım</h1>
      <p className="mt-1 text-sm text-muted">
        Bu bilgiler kullanıcı sitesinde restoranınızın görüneceği şekliyle gösterilir.
      </p>

      {(kaydedildi || hata) && <UrlTemizle parametreler={["kaydedildi", "hata"]} />}
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

      <RestoranimForm restoran={restoran} kaydet={kaydet} semtSecenekleri={semtSecenekleri} />
    </div>
  );
}
