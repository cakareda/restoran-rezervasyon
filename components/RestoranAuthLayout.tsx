import type { ReactNode } from "react";

const FOTO =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80";

export default function RestoranAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <div
        className="relative hidden w-1/2 bg-cover bg-center lg:block"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(20,8,10,0.75), rgba(20,8,10,0.15)), url(${FOTO})`,
        }}
      >
        <div className="absolute bottom-16 left-10 right-10 text-white">
          <p className="text-3xl font-extrabold leading-tight">Masadaki&apos;ye hoş geldin</p>
          <p className="mt-2 text-white/85">Talep topla · Panelden yönet · Misafiri elde tut</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-brand-light px-6 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-red-900/5">
          {children}
        </div>
      </div>
    </div>
  );
}
