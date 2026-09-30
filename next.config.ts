import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// CSP'yi gerçek entegrasyonlara göre kısıtlıyoruz: Google Maps/Places, Supabase
// (auth + storage), QR kod servisi, Unsplash stok görselleri. next/script ve
// Tailwind'in ürettiği satır içi stiller için 'unsafe-inline' gerekiyor; nonce
// bazlı katı CSP bu ölçekte gereksiz karmaşıklık katardı.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://*.gstatic.com https://images.unsplash.com https://api.qrserver.com",
  "connect-src 'self' https://*.supabase.co https://maps.googleapis.com",
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

const GUVENLIK_BASLIKLARI = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Widget, restoranın kendi sitesine iframe olarak gömülmek üzere
        // tasarlandı — bu yüzden genel çerçeveleme kısıtlamalarından muaf.
        // Next.js aynı yola uyan header kurallarını birleştirip çakışan
        // anahtarları sonraki kuralla ezdiği için, genel kuralın regex'i
        // /widget yolunu tamamen dışlıyor (yoksa SAMEORIGIN/CSP yine binerdi).
        source: "/widget/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/((?!widget/).*)",
        headers: GUVENLIK_BASLIKLARI,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
