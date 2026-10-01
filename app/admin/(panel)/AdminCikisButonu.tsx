"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminCikisButonu() {
  const router = useRouter();
  const supabase = createClient();

  async function cikisYap() {
    await supabase.auth.signOut();
    router.push("/admin/giris");
    router.refresh();
  }

  return (
    <button type="button" onClick={cikisYap} className="hover:text-brand-dark">
      Çıkış yap
    </button>
  );
}
