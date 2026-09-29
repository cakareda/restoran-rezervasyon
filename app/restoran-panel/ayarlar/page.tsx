import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AyarlarForm from "./AyarlarForm";

async function kaydet(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const hatirlatmaAktif = formData.get("hatirlatmaEpostasi") === "on";
  const enErkenSaat = Math.max(0, Number(formData.get("enErkenSaat") ?? 1));
  const enGecGun = Math.max(1, Number(formData.get("enGecGun") ?? 60));
  const maksimumKisi = Math.max(1, Number(formData.get("maksimumKisi") ?? 20));

  await supabase
    .from("restoranlar")
    .update({
      hatirlatma_epostasi_aktif: hatirlatmaAktif,
      en_erken_rezervasyon_saat: enErkenSaat,
      en_gec_rezervasyon_gun: enGecGun,
      maksimum_kisi_sayisi: maksimumKisi,
    })
    .eq("auth_user_id", user.id);

  revalidatePath("/restoran-panel/ayarlar");
  redirect("/restoran-panel/ayarlar?kaydedildi=1");
}

export default async function Ayarlar({
  searchParams,
}: {
  searchParams: Promise<{ kaydedildi?: string }>;
}) {
  const { kaydedildi } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restoran } = await supabase
    .from("restoranlar")
    .select(
      "eposta, hatirlatma_epostasi_aktif, en_erken_rezervasyon_saat, en_gec_rezervasyon_gun, maksimum_kisi_sayisi"
    )
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">Ayarlar</h1>
      <p className="mt-1 text-sm text-muted">Hesap ve bildirim tercihlerini yönet.</p>

      {kaydedildi && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          ✓ Kaydedildi.
        </p>
      )}

      <div className="mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-foreground">Giriş e-postası</p>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">Şifre</p>
          <p className="mt-1 text-sm text-muted">
            Şifreni sıfırlamak için çıkış yapıp giriş ekranındaki &quot;Şifremi unuttum&quot;
            bağlantısını kullan.
          </p>
        </div>
      </div>

      <AyarlarForm
        kaydet={kaydet}
        hatirlatmaAktif={restoran?.hatirlatma_epostasi_aktif ?? true}
        enErkenSaat={restoran?.en_erken_rezervasyon_saat ?? 1}
        enGecGun={restoran?.en_gec_rezervasyon_gun ?? 60}
        maksimumKisi={restoran?.maksimum_kisi_sayisi ?? 20}
      />
    </div>
  );
}
