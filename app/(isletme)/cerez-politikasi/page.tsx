import type { Metadata } from "next";
import Link from "next/link";

const BASLIK = "Çerez Politikası";

export const metadata: Metadata = {
  title: BASLIK,
  robots: { index: true, follow: true },
  alternates: { canonical: "https://masadaki.com/cerez-politikasi" },
};

export default function CerezPolitikasiSayfasi() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{BASLIK}</h1>
      <p className="mt-2 text-sm text-muted">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>

      <p className="mt-6 text-sm leading-relaxed text-foreground/80">
        Masadaki, yalnızca restoran sahiplerinin giriş yaptığı panel sayfalarında (
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">/restoran-panel/*</code>)
        oturumunuzu açık tutmak için <strong>zorunlu (essential) çerezler</strong> kullanır. Bu
        çerezler olmadan panele giriş yapıp oturumunuzu sürdüremezsiniz; bu nedenle kapatılamaz
        veya reddedilemez.
      </p>

      <p className="mt-4 text-sm leading-relaxed text-foreground/80">
        Platform şu an hiçbir analiz (analytics), reklam veya üçüncü taraf takip çerezi
        kullanmamaktadır. Tarayıcınızın yerel depolama alanı (localStorage), bu sayfadaki
        bilgilendirme kutucuğunu daha önce gördüğünüzü hatırlamak dışında kullanılmaz.
      </p>

      <p className="mt-4 text-sm leading-relaxed text-foreground/80">
        Bu durum değişir ve ileride analiz veya pazarlama amaçlı çerezler eklenirse, bu sayfa
        güncellenecek ve gerekli onay (kabul/reddet) mekanizması eklenecektir.
      </p>

      <h2 className="mt-8 text-lg font-bold text-foreground">Kullandığımız çerez</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Çerez</th>
              <th className="px-4 py-2">Amaç</th>
              <th className="px-4 py-2">Süre</th>
              <th className="px-4 py-2">Kategori</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-4 py-2 font-mono text-xs">sb-*-auth-token</td>
              <td className="px-4 py-2 text-foreground/80">Restoran paneli oturum doğrulama</td>
              <td className="px-4 py-2 text-foreground/80">Oturum boyunca / yenilenebilir</td>
              <td className="px-4 py-2 text-foreground/80">Zorunlu</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-foreground/80">
        Sorularınız için{" "}
        <Link href="/kvkk" className="font-semibold text-brand hover:underline">
          KVKK Aydınlatma Metni
        </Link>{" "}
        sayfamıza bakabilir veya{" "}
        <a href="mailto:info@masadaki.com" className="font-semibold text-brand hover:underline">
          info@masadaki.com
        </a>{" "}
        adresinden bize ulaşabilirsiniz.
      </p>
    </div>
  );
}
