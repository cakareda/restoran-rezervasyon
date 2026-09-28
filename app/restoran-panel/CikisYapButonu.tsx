"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CikisYapButonu() {
  const router = useRouter();
  const supabase = createClient();

  async function cikisYap() {
    await supabase.auth.signOut();
    router.push("/restoran-girisi");
    router.refresh();
  }

  return (
    <button onClick={cikisYap} className="text-sm font-medium text-muted hover:text-brand-dark">
      Çıkış yap
    </button>
  );
}
