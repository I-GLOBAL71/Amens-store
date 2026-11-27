import {
  buildAffiliateUrl,
  type ArticleDTO,
  type ArticleDetailPayload,
  type InitialArticlesPayload,
  type ProgramDTO,
} from "@/lib/pipeline/types";

/**
 * Filtre instantanément la liste d'articles déjà en cache par silo.
 * Évite d'afficher des squelettes lorsqu'on clique sur une catégorie ou un filtre.
 */
export function filterCachedArticlesBySilo(
  allPayload: InitialArticlesPayload | undefined,
  silo?: string | null
): InitialArticlesPayload | undefined {
  if (!allPayload) return undefined;
  if (!silo) return allPayload;
  return {
    articles: allPayload.articles.filter((a) => a.silo === silo),
    siloCounts: allPayload.siloCounts,
  };
}

/**
 * Filtre et trie instantanément les programmes partenaires déjà en cache
 * selon les mêmes règles que GET /api/programs.
 */
export function filterCachedPrograms(
  rawPrograms: ProgramDTO[] | undefined,
  params: { angle?: number; context?: string; geo?: string; articleSlug?: string } = {}
): { programs: (ProgramDTO & { trackingUrl: string })[] } | undefined {
  if (!rawPrograms) return undefined;
  const filtered = rawPrograms.filter((p) => {
    if (!p.active) return false;
    if (params.context && p.context !== params.context) return false;
    if (params.angle !== undefined && p.anglePrincipal !== params.angle) return false;
    if (params.geo === "africa" && p.geoTarget !== "africa" && p.geoTarget !== "global") {
      return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    if (params.geo === "africa" && a.geoTarget !== b.geoTarget) {
      return (b.geoTarget === "africa" ? 1 : 0) - (a.geoTarget === "africa" ? 1 : 0);
    }
    return b.priorityScore - a.priorityScore;
  });
  const slug = params.articleSlug ?? "";
  return {
    programs: filtered.map((p) => ({
      ...p,
      trackingUrl: buildAffiliateUrl(p.affiliateUrl, slug),
    })),
  };
}

/**
 * Construit immédiatement un ArticleDetailPayload complet à partir des caches
 * articles + programmes déjà injectés au chargement initial (0 ms à l'ouverture).
 */
export function buildCachedArticleDetail(
  slug: string | null,
  articlesPool: ArticleDTO[],
  programsPool: ProgramDTO[]
): ArticleDetailPayload | undefined {
  if (!slug || articlesPool.length === 0) return undefined;
  const article = articlesPool.find((a) => a.slug === slug);
  if (!article) return undefined;

  const activePrograms = programsPool
    .filter((p) => p.active)
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const primary = article.primaryProgram
    ? activePrograms.find((p) => p.slug === article.primaryProgram) ?? null
    : null;
  const alternatives = activePrograms
    .filter((p) => (primary ? p.context === primary.context && p.slug !== primary.slug : true))
    .slice(0, 2);

  const others = articlesPool
    .filter((a) => a.status === "published" && a.id !== article.id)
    .sort((a, b) => b.views - a.views);
  const sameSilo = others.filter((a) => a.silo === article.silo).slice(0, 3);
  const interSilo = others.filter((a) => a.silo !== article.silo).slice(0, 3);

  return {
    article,
    primaryProgram: primary
      ? { ...primary, trackingUrl: buildAffiliateUrl(primary.affiliateUrl, article.slug) }
      : null,
    alternatives: alternatives.map((a) => ({
      ...a,
      trackingUrl: buildAffiliateUrl(a.affiliateUrl, article.slug),
    })),
    maillage: {
      silo: sameSilo,
      inter: interSilo,
    },
  };
}
