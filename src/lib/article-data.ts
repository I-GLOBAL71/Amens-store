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
    await db.article
      .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
      .catch(() => {});
  }

  // Résolution des programmes (schéma affiliation) : primaire + alternatives
  // du même contexte, géo-ciblage Afrique → programmes Mobile Money prioritaires.
  const primary = article.primaryProgram
    ? await db.affiliateProgram.findUnique({ where: { slug: article.primaryProgram } })
    : null;
  const alternatives = await db.affiliateProgram.findMany({
    where: {
      active: true,
      ...(primary ? { context: primary.context, slug: { not: primary.slug } } : {}),
    },
    orderBy: { priorityScore: "desc" },
    take: 2,
  });

  // Maillage : articles du même silo + suggestions inter-silos
  const sameSilo = await db.article.findMany({
    where: { silo: article.silo, status: "published", id: { not: article.id } },
    orderBy: { views: "desc" },
    take: 3,
  });
  const interSilo = await db.article.findMany({
    where: { status: "published", silo: { not: article.silo } },
    orderBy: { views: "desc" },
    take: 3,
  });

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
