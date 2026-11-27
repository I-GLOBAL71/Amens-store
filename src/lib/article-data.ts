// Chargeur d'article détaillé — SOURCE UNIQUE partagée entre :
//   1. GET /api/articles/[...slug] (API publique, incrémente les vues)
//   2. le rendu serveur de la route / (page.tsx) — SANS incrément de vues :
//      un crawler (moteur classique ou agent IA sans JavaScript) ne doit pas
//      fausser le compteur de vues en occasionnant un rendu.
// Les deux producteurs restent alignés sur ArticleDetailPayload (types.ts) :
// c'est un invariant anti-régression (GUARDRAILS.md §2.11).
import { db } from "@/lib/db";
import { serializeArticle, serializeProgram } from "@/lib/serialize";
import { buildAffiliateUrl } from "@/lib/pipeline/types";
import type { ArticleDetailPayload } from "@/lib/pipeline/types";

export async function loadArticleDetail(
  slug: string,
  opts: { incrementViews?: boolean } = {}
): Promise<ArticleDetailPayload | null> {
  const article = await db.article.findUnique({ where: { slug } });
  if (!article) return null;

  if (opts.incrementViews) {
    // Non bloquant : l'incrément de vues ne doit pas retarder l'ouverture de l'article
    void db.article
      .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
      .catch(() => {});
  }

  // Requêtes parallèles : programmes actifs + maillage même silo + inter-silos
  // (réduit la latence de 4 allers-retours séquentiels à 1 seul en production).
  const [allPrograms, sameSilo, interSilo] = await Promise.all([
    db.affiliateProgram.findMany({
      where: { active: true },
      orderBy: { priorityScore: "desc" },
    }),
    db.article.findMany({
      where: { silo: article.silo, status: "published", id: { not: article.id } },
      orderBy: { views: "desc" },
      take: 3,
    }),
    db.article.findMany({
      where: { status: "published", silo: { not: article.silo } },
      orderBy: { views: "desc" },
      take: 3,
    }),
  ]);

  const primary = article.primaryProgram
    ? allPrograms.find((p) => p.slug === article.primaryProgram) ?? null
    : null;
  const alternatives = allPrograms
    .filter((p) => (primary ? p.context === primary.context && p.slug !== primary.slug : true))
    .slice(0, 2);

  return {
    article: serializeArticle(article),
    primaryProgram: primary
      ? {
          ...serializeProgram(primary),
          trackingUrl: buildAffiliateUrl(primary.affiliateUrl, article.slug),
        }
      : null,
    alternatives: alternatives.map((a) => ({
      ...serializeProgram(a),
      trackingUrl: buildAffiliateUrl(a.affiliateUrl, article.slug),
    })),
    maillage: {
      silo: sameSilo.map(serializeArticle),
      inter: interSilo.map(serializeArticle),
    },
  };
}
