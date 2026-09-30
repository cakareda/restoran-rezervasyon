import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/restoran-panel",
          "/restoran-panel/",
          "/hesap/",
          "/rezervasyon/",
          "/rezervasyon-basarili",
          "/yorum/",
          "/api/",
          "/widget/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
