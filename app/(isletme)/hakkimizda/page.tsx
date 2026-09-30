import type { Metadata } from "next";

const BASLIK = "Hakkımızda";
const ACIKLAMA = "Masadaki'yi kim, neden geliştiriyor?";

export const metadata: Metadata = {
  title: BASLIK,
  description: ACIKLAMA,
  alternates: { canonical: "https://masadaki.com/hakkimizda" },
  openGraph: {
    title: `${BASLIK} — Masadaki`,
    description: ACIKLAMA,
    url: "https://masadaki.com/hakkimizda",
    locale: "tr_TR",
  },
};

const p = "mt-4 text-[15px] leading-7 text-foreground/90";

export default function HakkimizdaSayfasi() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{BASLIK}</h1>

      <p className={p}>Merhaba, ben Eda Çakar.</p>

      <p className={p}>
        Masadaki&apos;yi tek başıma tasarlıyor ve işletiyorum. 2019&apos;dan beri İtalya&apos;da
        yaşıyorum ve Politecnico di Torino&apos;da Bilgisayar Mühendisliği okudum. Şu an ekranda
        gördüğünüz bu sistemin her bir satır kodunu, altyapısından tasarımına kadar bizzat ben
        yazıyorum.
      </p>

      <p className={p}>
        Bu fikir basit bir gözlemden doğdu: Türkiye&apos;deki restoranların büyük çoğunluğu hâlâ
        rezervasyonları telefonla ve kağıt üzerinde tutuyor. Oysa işletmelerin kendi rezervasyon
        altyapısına sahip olabileceği, misafir verisinin tamamen kendilerinde kaldığı, gizli
        ücretler veya ağır cezai şartlar içermeyen adil ve şeffaf bir sisteme ihtiyaçları var.
      </p>

      <p className={p}>
        Masadaki&apos;nin arkasında hantal bir kurumsal yapı veya yatırımcı ordusu yok; doğrudan
        ürünü geliştiren gerçek bir yazılım mühendisi var. Bu da demek oluyor ki, restoran
        sahiplerinden gelen her geri bildirimi anında duyuyor ve doğrudan sisteme entegre
        edebiliyorum. Bir şey eksikse veya daha iyi çalışabileceğini düşünüyorsanız, bunu ilk
        elden duymak isterim.
      </p>

      <p className={p}>
        Sorularınız veya önerileriniz için{" "}
        <a
          href="mailto:info@masadaki.com"
          className="font-semibold text-brand hover:underline"
        >
          info@masadaki.com
        </a>{" "}
        adresinden ya da{" "}
        <a
          href="https://linkedin.com/in/edacakar"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand hover:underline"
        >
          LinkedIn
        </a>{" "}
        üzerinden bana ulaşabilirsiniz.
      </p>
    </div>
  );
}
