// /sitemap.xml — généré par Next (route metadata) depuis la base : accueil,
// vues principales et chaque article publié. Invisible côté visiteur.
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { ANGLES } from "@/lib/pipeline/types";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/?v=blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/?v=outils`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/?v=labo`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/?v=promos`, changeFrequency: "daily", priority: 0.8 },
    // silos du blog
    ...ANGLES.map((a) => ({
      url: `${BASE}/?v=blog&silo=${encodeURIComponent(a.silo)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  try {
    const articles = await db.article.findMany({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, updatedAt: true },
    });
    for (const a of articles) {
      urls.push({
        url: `${BASE}/?v=article&slug=${encodeURIComponent(a.slug)}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // base indisponible au rendu : le sitemap statique de base est quand même servi
  }

  return urls;
}
