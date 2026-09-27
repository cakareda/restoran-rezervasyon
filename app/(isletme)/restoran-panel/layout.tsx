import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CikisYapButonu from "./CikisYapButonu";

export default async function RestoranPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/restoran-girisi");

  return (
    <div className="flex flex-1 flex-col bg-[#faf7f4]">
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex gap-1 text-sm font-semibold">
            <Link
              href="/restoran-panel"
              className="rounded-full px-3 py-1.5 text-foreground hover:bg-brand-light hover:text-brand-dark"
            >
              Rezervasyonlar
            </Link>
            <Link
              href="/restoran-panel/restoranim"
              className="rounded-full px-3 py-1.5 text-foreground hover:bg-brand-light hover:text-brand-dark"
            >
              Restoranım
            </Link>
          </div>
          <CikisYapButonu />
        </div>
      </nav>
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
