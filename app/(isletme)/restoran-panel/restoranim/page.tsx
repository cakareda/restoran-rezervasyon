import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RestoranimForm from "./RestoranimForm";

async function kaydet(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const olanaklar = formData
    .getAll("olanaklar")
    .map((deger) => String(deger).trim())
    .filter(Boolean);

  const fotograflar = String(formData.get("fotograflar") ?? "")
    .split("\n")
    .map((satir) => satir.trim())
    .filter(Boolean);

  const { error } = await supabase.from("restoranlar").upsert(
    {
      auth_user_id: user.id,
      ad: String(formData.get("ad")),
      sehir: String(formData.get("sehir")),
      semt: String(formData.get("semt")),
      mutfak_turu: String(formData.get("mutfakTuru")),
      eposta: String(formData.get("eposta")),
      telefon: String(formData.get("telefon") ?? ""),
      kapasite: formData.get("kapasite") ? Number(formData.get("kapasite")) : null,
      ortalama_fiyat: String(formData.get("ortalamaFiyat") ?? ""),
      aciklama: String(formData.get("aciklama") ?? ""),
      adres: String(formData.get("adres") ?? ""),
      acilis_saati: String(formData.get("acilisSaati") ?? "12:00"),
      kapanis_saati: String(formData.get("kapanisSaati") ?? "23:00"),
      oturma_suresi_dk: formData.get("oturmaSuresiDk")
        ? Number(formData.get("oturmaSuresiDk"))
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

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Restoranım</h1>
      <p className="mt-1 text-sm text-muted">
        Bu bilgiler kullanıcı sitesinde restoranınızın görüneceği şekliyle gösterilir.
      </p>

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

      <RestoranimForm restoran={restoran} kaydet={kaydet} />
    </div>
  );
}
