import type { Metadata } from "next";
import { db } from "@/lib/db";
import { serializeArticle } from "@/lib/serialize";
import { loadLaboData } from "@/lib/labo-data";
import { loadArticleDetail } from "@/lib/article-data";
import { SITE_URL } from "@/lib/site";
import {
  ANGLES,
  type LaboFull,
  type InitialArticlesPayload,
  type ArticleDetailPayload,
  type ViewName,
} from "@/lib/pipeline/types";
import { AmensApp } from "@/components/amens/amens-app";
import { getArticleCoverUrl } from "@/lib/article-image";

// Route unique visible : / — application amens.store dont l'état vit dans
// l'URL (?v=blog, ?v=article&slug=…, &silo=…).
//
// SSR PAR VUE ET PAR ARTICLE : l'état de navigation est lu côté serveur
// (searchParams) — le HTML servi pour /?v=article&slug=… contient l'article
// complet, son fil d'Ariane, ses métadonnées (title, description, canonical,
// og:) et son JSON-LD. Les agents IA qui n'exécutent pas JavaScript
// (GPTBot, PerplexityBot, ClaudeBot…) lisent le contenu réel de l'article,
// et non plus une page d'accueil par défaut. Le compteur de vues n'est PAS
// incrémenté au rendu serveur (un crawler ne doit pas fausser les statistiques).
//
// Les données initiales (stats Labo + liste d'articles) restent chargées côté
// serveur et injectées dans le cache TanStack Query : aucun placeholder
// « … », même sur connexion lente. Optimisations invisibles côté visiteur.
export const dynamic = "force-dynamic";

const VIEWS: ViewName[] = ["home", "blog", "article", "studio", "labo", "outils", "promos"];

interface PageSearchParams {
  v?: string;
  slug?: string;
  silo?: string;
  tab?: string;
  outil?: string;
}

function parseNav(sp: PageSearchParams) {
  const v = (sp.v as ViewName | undefined) ?? "home";
  return {
    view: VIEWS.includes(v) ? v : ("home" as ViewName),
    slug: sp.slug ?? null,
    silo: sp.silo ?? null,
    studioTab: sp.tab ?? null,
    outil: sp.outil ?? null,
  };
}

// Métadonnées par vue et par article : title/description/canonical/OG rendus
// dans le <head> du HTML servi (côté serveur, lisibles sans JavaScript).
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const nav = parseNav(sp);
  if (nav.view === "article" && nav.slug) {
    try {
      const a = await db.article.findUnique({
        where: { slug: nav.slug },
        select: {
          title: true,
          metaTitle: true,
          metaDescription: true,
          excerpt: true,
          slug: true,
          silo: true,
          author: true,
          publishedAt: true,
          updatedAt: true,
        },
      });
      if (a) {
        const url = `${SITE_URL}/?v=article&slug=${encodeURIComponent(a.slug)}`;
        const pageTitle = a.metaTitle || a.title;
        const pageDesc = a.metaDescription || a.excerpt;
        const coverUrl = getArticleCoverUrl(a.slug);
        return {
          title: pageTitle,
          description: pageDesc,
          authors: [{ name: a.author === "equipe-amens" ? "Équipe amens.store" : a.author }],
          alternates: { canonical: url },
          openGraph: {
            title: pageTitle,
            description: pageDesc,
            url,
            type: "article",
            section: a.silo,
            publishedTime: a.publishedAt?.toISOString(),
            modifiedTime: a.updatedAt.toISOString(),
            images: [{ url: coverUrl, width: 1200, height: 630, alt: a.title }],
          },
          twitter: {
            card: "summary_large_image",
            title: pageTitle,
            description: pageDesc,
            images: [coverUrl],
          },
        };
      }
    } catch {
      // base indisponible : les métadonnées du layout s'appliquent
    }
  }

  if (nav.view === "blog") {
    const angleSel = nav.silo ? ANGLES.find((a) => a.silo === nav.silo) : undefined;
    const url = angleSel
      ? `${SITE_URL}/?v=blog&silo=${encodeURIComponent(angleSel.silo)}`
      : `${SITE_URL}/?v=blog`;
    const title = angleSel
      ? `${angleSel.nom} : guides testés`
      : "Le blog : guides d'exécution testés (hébergement, IA, Mobile Money)";
    const description = angleSel
      ? angleSel.description
      : "Guides pas-à-pas pour héberger n8n, mettre en ligne une app vibe-codée, payer par Orange Money et vérifier les renouvellements. Prix datés et mesures Labo.";
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }

  if (nav.view === "labo") {
    const url = `${SITE_URL}/?v=labo`;
    const title = "Le Labo : mesures publiques d'uptime, latence Afrique et prix datés";
    const description =
      "Relevés continus de disponibilité, latence depuis Douala, Abidjan et Dakar, et historique réel des prix promo vs renouvellement chez 8 hébergeurs.";
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }

  if (nav.view === "outils") {
    const url = `${SITE_URL}/?v=outils`;
    const title = "Outils et calculateurs d'hébergement web (coût 3 ans, VPS, Mobile Money)";
    const description =
      "Calcule le vrai coût sur 12 à 36 mois renouvellement compris, estime la RAM pour n8n/Ollama et vérifie les hébergeurs payables sans carte bancaire.";
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }

  if (nav.view === "promos") {
    const url = `${SITE_URL}/?v=promos`;
    const title = "Promos et codes vérifiés hébergement web novembre 2026";
    const description =
      "Remises réelles et tarifs de renouvellement contrôlés sur les plans mutualisés, VPS, cloud et email professionnel en novembre 2026.";
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }

  return {
    alternates: { canonical: `${SITE_URL}/` },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const initialNav = parseNav(await searchParams);

  let initialLabo: LaboFull | null = null;
  let initialArticles: InitialArticlesPayload | null = null;
  let initialArticleDetail: ArticleDetailPayload | null = null;

  try {
    initialLabo = await loadLaboData();
  } catch {
    initialLabo = null;
  }
  try {
    const [articles, siloCounts] = await Promise.all([
      db.article.findMany({
        where: { status: "published" },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 100,
      }),
      db.article.groupBy({
        by: ["silo"],
        where: { status: "published" },
        _count: { id: true },
      }),
    ]);
    initialArticles = {
      articles: articles.map(serializeArticle),
      siloCounts: siloCounts.map((s) => ({ silo: s.silo, count: s._count.id })),
    };
  } catch {
    initialArticles = null;
  }
  // Vue article → l'article complet est chargé côté serveur et injecté dans
  // le cache TanStack (clé ["article", slug]) : le HTML servi contient le
  // contenu réel, les crawlers sans JS le lisent.
  if (initialNav.view === "article" && initialNav.slug) {
    try {
      initialArticleDetail = await loadArticleDetail(initialNav.slug);
    } catch {
      initialArticleDetail = null;
    }
  }

  return (
    <AmensApp
      initialLabo={initialLabo}
      initialArticles={initialArticles}
      initialArticleDetail={initialArticleDetail}
      initialNav={initialNav}
    />
  );
}
