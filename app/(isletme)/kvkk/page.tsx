import type { Metadata } from "next";
import Link from "next/link";

const BASLIK = "KVKK Aydınlatma Metni";

export const metadata: Metadata = {
  title: BASLIK,
  robots: { index: true, follow: true },
  alternates: { canonical: "https://masadaki.com/kvkk" },
};

const altBaslik = "mt-5 text-sm font-bold uppercase tracking-wide text-brand-dark";
const p = "mt-3 text-[15px] leading-7 text-foreground/90";
const li = "mt-1.5 text-[15px] leading-7 text-foreground/90";
const detaySinifi = "mt-5 rounded-2xl border border-border bg-white open:shadow-sm";
const ozetSinifi =
  "flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-lg font-bold text-foreground marker:content-none [&::-webkit-details-marker]:hidden";
const icerikSinifi = "border-t border-border px-5 pb-5";

export default function KvkkSayfasi() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{BASLIK}</h1>
      <p className="mt-2 text-sm text-muted">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>

      <p className={p}>
        masadaki.com Platformu&apos;nu tek başına işleten gerçek kişi olan Eda Çakar, henüz bir
        şirket kurulmadığı için 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca veri
        sorumlusu sıfatıyla, Platform üzerinden elde ettiğimiz kişisel verilerinizi aşağıda
        açıklanan kapsamda işlemekteyiz. Platformu kimin işlettiği hakkında daha fazla bilgi
        için{" "}
        <Link href="/hakkimizda" className="font-semibold text-brand hover:underline">
          Hakkımızda
        </Link>{" "}
        sayfamıza bakabilirsiniz.
      </p>

      {/* Kademeli aydınlatma: önce özet, detaylar aşağıda açılır panellerde */}
      <div className="mt-6 rounded-2xl bg-brand-light p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-dark">Kısaca</p>
        <ul className="ml-5 mt-2 list-disc text-sm leading-relaxed text-foreground/90">
          <li>Rezervasyon için ad, telefon, e-posta ve rezervasyon bilgilerinizi işliyoruz.</li>
          <li>Verinizi yalnızca ilgili restoranla ve hizmeti çalıştırmak için gereken alt yapı sağlayıcılarla (Supabase, Resend, Google Maps) paylaşıyoruz — hiçbir pazarlama/reklam şirketiyle paylaşmıyoruz.</li>
          <li>Alerji/sağlık bilgisi yazarsanız ayrı bir onay kutusuyla açık rızanızı alıyoruz.</li>
          <li>Yorumlarınız isimsiz yayınlanır.</li>
          <li>Verinizle ilgili her zaman bilgi, düzeltme, silme talep edebilir; gerekirse Kurul&apos;a şikâyet edebilirsiniz.</li>
        </ul>
        <p className="mt-3 text-xs text-foreground/70">
          Aşağıdaki başlıklara tıklayarak tüm detayları okuyabilirsiniz. Çerezler hakkında ayrı bir{" "}
          <Link href="/cerez-politikasi" className="font-semibold text-brand hover:underline">
            Çerez Politikası
          </Link>{" "}
          sayfamız var.
        </p>
      </div>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          Veri Sorumlusu ve Veri İşleyen Ayrımı
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <p className={p}>
            Masadaki, işlediği kişisel verinin türüne göre farklı sıfatlarla hareket eder.
          </p>
          <p className={`${p} font-semibold`}>a) Masadaki&apos;nin veri sorumlusu olduğu haller:</p>
          <ul className="ml-5 list-disc">
            <li className={li}>Platform&apos;u ziyaret eden herkesin genel kullanım verisi</li>
            <li className={li}>Misafir hesabı oluşturan kullanıcıların hesap bilgileri (ad, e-posta, telefon)</li>
            <li className={li}>Restoran sahiplerinin/panel kullanıcılarının kendi hesap ve işletme bilgileri</li>
            <li className={li}>İleride toplanacak pazarlama izinleri</li>
          </ul>
          <p className={`${p} font-semibold`}>b) Masadaki&apos;nin veri işleyen olduğu haller:</p>
          <p className={p}>
            Bir misafirin belirli bir restorana yaptığı rezervasyona ait detaylar ve bu rezervasyona
            restoran personeli tarafından eklenen notlar (örn. sık gelmeme uyarısı, VIP işareti,
            misafirin kendi eklediği alerji/özel istek notu). Bu verinin işlenme amacını fiilen ilgili
            restoran belirler; Masadaki bu veriyi yalnızca restoranın rezervasyon yönetimi amacıyla
            barındırır ve aktarır. Bu kapsamdaki verilerle ilgili haklarınızı kullanmak isterseniz hem
            Masadaki&apos;ye hem doğrudan ilgili restorana başvurabilirsiniz; restorana özgü
            taleplerde sizi ilgili restorana yönlendirebiliriz. Restoranlara ilettiğimiz rezervasyon ve
            misafir bilgileri, yalnızca o rezervasyonun yönetimi amacıyla kullanılmak üzere ilgili
            restorana aktarılır ve taraflar arasındaki ilişki çerçevesinde gizli tutulur.
          </p>
        </div>
      </details>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          İşlenen Kişisel Veriler
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <p className={altBaslik}>A. Rezervasyon yapan misafirler için</p>
          <ul className="ml-5 list-disc">
            <li className={li}>Kimlik ve iletişim bilgileri: ad soyad, telefon numarası, e-posta adresi</li>
            <li className={li}>Rezervasyon bilgileri: tarih/saat, kişi sayısı, özel gün bilgisi, alan tercihi</li>
            <li className={li}>
              Rezervasyona eklediğiniz notlar — aşağıdaki &quot;Özel Nitelikli Veri&quot; bölümüne bakın
            </li>
            <li className={li}>İşlem güvenliği bilgileri: rezervasyon geçmişi, gelme/gelmeme durumu</li>
            <li className={li}>Tercih bilgileri: site dili</li>
            <li className={li}>
              Değerlendirme bilgileri: verdiğiniz puan ve yorum metni — yorumlarınız isim
              belirtilmeden, anonim olarak Platform&apos;da herkese açık yayınlanır
            </li>
          </ul>
          <p className={altBaslik}>B. Restoran sahipleri / işletme hesapları için</p>
          <ul className="ml-5 list-disc">
            <li className={li}>Kimlik ve iletişim bilgileri: ad soyad/işletme adı, e-posta, telefon</li>
            <li className={li}>
              İşletme bilgileri: adres, konum, çalışma saatleri, fiyat/mutfak bilgisi, fotoğraflar,
              menü linki, işletmeyi kaydederken Google&apos;da yazdığınız arama sorgusu
            </li>
            <li className={li}>Hesap bilgileri: giriş kimlik bilgileriniz (Supabase Auth üzerinden)</li>
          </ul>
        </div>
      </details>

      <details className={detaySinifi} open>
        <summary className={ozetSinifi}>
          Özel Nitelikli Kişisel Veri Uyarısı (alerji / sağlık bilgisi)
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <p className={p}>
            Rezervasyon formundaki &quot;not&quot; alanı, alerji veya diğer sağlık bilgilerini
            paylaşmanıza imkân tanır. Bu tür bilgiler KVKK m.6 uyarınca özel nitelikli kişisel veri
            sayılır ve genel rezervasyon verilerinden farklı, <strong>ayrı açık rızanızla</strong>{" "}
            işlenir. Bu alana sağlık/alerji bilgisi de dahil bir şey yazdığınızda, rezervasyon
            formunda not alanının altında ayrı bir onay kutusu (&quot;Bu alana yazdığım bilgilerin
            ilgili restoranla paylaşılmasına açık rıza veriyorum&quot;) belirir; bu kutuyu
            işaretlemezseniz, rezervasyonunuz yine de oluşturulur ama yazdığınız not hiç
            kaydedilmez ve restorana iletilmez. Bu davranış hem tarayıcınızda hem sunucumuzda
            (çift kontrol olarak) uygulanır.
          </p>
        </div>
      </details>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          İşlenme Amaçları ve Hukuki Sebep
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <ul className="ml-5 list-disc">
            <li className={li}>Rezervasyon talebinizin ilgili restorana iletilmesi ve sonucunun tarafınıza bildirilmesi</li>
            <li className={li}>Rezervasyon hatırlatma, onay, red, iptal bildirimlerinin gönderilmesi</li>
            <li className={li}>Bekleme listesi ve değerlendirme (yorum) süreçlerinin yürütülmesi</li>
            <li className={li}>
              Restoran hesabı sahipleri için işletme profilinin platformda yayınlanması ve
              rezervasyon operasyonunun yönetilmesi
            </li>
            <li className={li}>Platform güvenliğinin sağlanması, kötüye kullanımın önlenmesi</li>
            <li className={li}>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
          <p className={p}>
            Platform şu an için herhangi bir pazarlama/kampanya e-postası veya SMS&apos;i
            göndermemektedir; gönderilen tüm iletiler rezervasyon süreciyle doğrudan ilgili,
            sözleşmesel nitelikte bildirimlerdir (KVKK m.5/2-c). İleride pazarlama iletişimi
            başlatılırsa, bunun için ayrı ve önceden alınmış açık rızanız istenecek ve İYS üzerinden
            yönetilecektir.
          </p>
          <p className={p}>
            Verileriniz, Platform üzerinden doldurduğunuz formlar aracılığıyla elektronik ortamda
            toplanır. Hukuki sebepler: KVKK m.5/2-c (sözleşmenin kurulması/ifası), m.5/2-ç (hukuki
            yükümlülük), m.5/2-f (meşru menfaat). Özel nitelikli veriler için KVKK m.6/2 uyarınca
            açık rızanız esas alınır.
          </p>
        </div>
      </details>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          Aktarıldığı Taraflar ve Yurt Dışı Aktarım
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <ul className="ml-5 list-disc">
            <li className={li}>
              <strong>Supabase Inc.</strong> — veritabanı barındırma ve kimlik doğrulama altyapısı
            </li>
            <li className={li}>
              <strong>Resend</strong> — rezervasyon bildirim e-postalarının gönderimi
            </li>
            <li className={li}>
              <strong>Google LLC</strong> (Google Maps/Places API) — yalnızca restoran hesabı
              sahibinin işletmesini kaydederken girdiği arama sorgusu ve seçtiği işletmenin
              adres/telefon/konum bilgisi için kullanılır; misafir rezervasyon verisi Google&apos;a
              hiçbir şekilde aktarılmaz
            </li>
            <li className={li}>İlgili restoran işletmesi — rezervasyon talebinizi değerlendirebilmesi için</li>
          </ul>
          <p className={p}>
            Yukarıdaki hizmet sağlayıcılar verilerinizi yurt dışındaki sunucularda işleyebilir. KVKK
            m.9&apos;un Temmuz 2024&apos;te yürürlüğe giren güncel hükümleri uyarınca, böyle bir
            aktarım ancak (i) Kişisel Verileri Koruma Kurulu&apos;nun yeterlilik kararı verdiği bir
            ülkeye, (ii) ilgili tarafların taahhütname imzalaması yoluyla, veya (iii) Kurul&apos;un
            onayladığı bağlayıcı şirket kuralları/standart sözleşme mekanizmalarından biri
            sağlanarak gerçekleştirilir. Kullandığımız hizmet sağlayıcıların sunucu bölgesi ve
            uygulanan aktarım mekanizması netleştikçe bu bölüm güncellenecektir.
          </p>
        </div>
      </details>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          Saklama Süresi
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <ul className="ml-5 list-disc">
            <li className={li}>Rezervasyon/hesap verisi: hesap/iş ilişkisi devam ettiği sürece</li>
            <li className={li}>Rezervasyon geçmişi, hesap kapandıktan sonra: 3 yıl</li>
            <li className={li}>
              Fatura/ödeme kaydı (ileride oluşursa): 10 yıl (Vergi Usul Kanunu, Türk Ticaret Kanunu
              m.82)
            </li>
            <li className={li}>Pazarlama izni verisi: rıza geri çekilene veya 3 yıl etkileşimsizliğe kadar</li>
            <li className={li}>Özel nitelikli veri (alerji notu): ilgili rezervasyon tarihinden itibaren 1 yıl</li>
          </ul>
        </div>
      </details>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          Haklarınız ve Başvuru Yöntemi (KVKK m.11)
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <p className={p}>
            KVKK&apos;nın 11. maddesi uyarınca; kişisel verinizin işlenip işlenmediğini öğrenme,
            işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp
            kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse
            düzeltilmesini isteme, KVKK&apos;da öngörülen şartlar çerçevesinde silinmesini/yok
            edilmesini isteme, yapılan işlemlerin aktarıldığı taraflara bildirilmesini isteme,
            otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme, zarara
            uğramanız hâlinde tazminat talep etme ve talebinizin reddedilmesi, yetersiz bulunması
            veya süresinde cevap verilmemesi hâlinde Kişisel Verileri Koruma Kurumu&apos;na
            şikâyette bulunma haklarına sahipsiniz.
          </p>
          <p className={p}>
            Başvurularınızı, &quot;Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ&quot;e
            uygun olarak aşağıdaki yollardan iletebilirsiniz:
          </p>
          <ul className="ml-5 list-disc">
            <li className={li}>
              <a href="mailto:info@masadaki.com" className="font-semibold text-brand hover:underline">
                info@masadaki.com
              </a>{" "}
              adresine, kayıtlı e-posta adresinizden (hesabınızla ilişkili e-posta) yazılı başvuru
            </li>
            <li className={li}>Varsa kayıtlı elektronik posta (KEP) adresi veya güvenli elektronik
              imza/mobil imza ile gönderilen başvuru
            </li>
            <li className={li}>Islak imzalı, kimliğinizi tevsik edici belgelerle birlikte posta yoluyla başvuru</li>
          </ul>
          <p className={p}>
            Başvurunuzda kimliğinizi ve talebinizi net şekilde belirtmeniz, değerlendirme sürecini
            hızlandırır. Talepler, mevzuatta öngörülen süre içinde (en geç 30 gün) yanıtlanır.
          </p>
        </div>
      </details>

      <details className={detaySinifi}>
        <summary className={ozetSinifi}>
          VERBİS Kaydı, Reşit Olmayanlar ve Metin Değişikliği
          <span aria-hidden className="text-muted">＋</span>
        </summary>
        <div className={icerikSinifi}>
          <p className={p}>
            <strong>VERBİS:</strong> Masadaki, faaliyet hacmi itibarıyla şu an Veri Sorumluları
            Sicili&apos;ne (VERBİS) kayıt yükümlülüğü eşiğinin altındadır. Kanunda öngörülen
            kayıt yükümlülüğü eşiğine ulaşıldığında VERBİS&apos;e kayıt yapılacak ve sicil numarası
            bu sayfada paylaşılacaktır.
          </p>
          <p className={p}>
            <strong>Reşit olmayanlar:</strong> Platform, 18 yaş ve üzeri kullanıcılara yöneliktir.
            Bilerek 18 yaş altı bireylerden kişisel veri toplanmamaktadır.
          </p>
          <p className={p}>
            <strong>Metinde değişiklik:</strong> Bu aydınlatma metni, mevzuat veya uygulama
            değişikliklerine göre güncellenebilir; güncel sürüm her zaman bu sayfada yayınlanır.
          </p>
        </div>
      </details>
    </div>
  );
}
