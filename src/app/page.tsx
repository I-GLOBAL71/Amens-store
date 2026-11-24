import type { Metadata } from "next";
import { db } from "@/lib/db";
import { serializeArticle } from "@/lib/serialize";
import { loadLaboData } from "@/lib/labo-data";
import { loadArticleDetail } from "@/lib/article-data";
import type {
  LaboFull,
  InitialArticlesPayload,
  ArticleDetailPayload,
  ViewName,
} from "@/lib/pipeline/types";
import { AmensApp } from "@/components/amens/amens-app";

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

// Métadonnées par article : title/description/canonical/OG rendus dans le
// <head> du HTML servi (côté serveur, lisibles sans JavaScript).
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
          updatedAt: true,
        },
      });
      if (a) {
        const url = `https://amens.store/?v=article&slug=${encodeURIComponent(a.slug)}`;
        return {
          title: a.metaTitle || a.title,
          description: a.metaDescription || a.excerpt,
          alternates: { canonical: url },
          openGraph: {
            title: a.metaTitle || a.title,
            description: a.metaDescription || a.excerpt,
            url,
            type: "article",
            modifiedTime: a.updatedAt.toISOString(),
          },
        };
      }
    } catch {
      // base indisponible : les métadonnées du layout s'appliquent
    }
  }
  return {};
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
