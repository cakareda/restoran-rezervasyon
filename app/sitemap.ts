import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { slugYap, restoranYolu } from "@/lib/slug";
import { DILLER } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://masadaki.com";

function dilliUrller(yol: string) {
  const languages: Record<string, string> = {};
  for (const dil of DILLER) {
    languages[dil] = dil === "tr" ? `${SITE_URL}${yol}` : `${SITE_URL}/${dil}${yol}`;
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: restoranlar } = await supabase
    .from("restoranlar")
    .select("id, ad, sehir, semt, mutfak_turu");

  const liste = restoranlar ?? [];

  const girdiler: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: dilliUrller("/") },
    },
    {
      url: `${SITE_URL}/restoranlar`,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: dilliUrller("/restoranlar") },
    },
  ];

  for (const r of liste) {
    girdiler.push({
      url: `${SITE_URL}${restoranYolu(r)}`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: dilliUrller(restoranYolu(r)) },
    });
  }

  const semtler = new Set(liste.map((r) => `${r.sehir}|${r.semt}`));
  for (const semtAnahtari of semtler) {
    const [sehir, semt] = semtAnahtari.split("|");
    const yol = `/restoranlar/${slugYap(sehir)}/${slugYap(semt)}`;
    girdiler.push({
      url: `${SITE_URL}${yol}`,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: dilliUrller(yol) },
    });
  }

  const mutfakTurleri = new Set(liste.map((r) => r.mutfak_turu).filter(Boolean));
  for (const mutfak of mutfakTurleri) {
    const yol = `/restoranlar/mutfak/${slugYap(mutfak)}`;
    girdiler.push({
      url: `${SITE_URL}${yol}`,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: dilliUrller(yol) },
    });
  }

  return girdiler;
}
