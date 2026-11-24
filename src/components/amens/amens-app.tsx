"use client";

// amens.store — application SPA sur la route unique / (toutes les vues sont
// portées par l'URL : ?v=blog, ?v=article&slug=… pour rester indexables).
//
// Les données initiales chargées côté serveur (page.tsx) sont injectées dans
// le cache TanStack Query dès la création du client : les stats du Labo et
// le nombre de guides s'affichent immédiatement, sans écran vide.
//
// L'état de navigation initial (page.tsx → searchParams) est confié au
// <NavProvider> : le store est créé AVEC cet état — le HTML servi pour
// /?v=article&slug=… est celui de l'article (SSR réel). Après hydratation,
// le client reprend la main pour les naviguations suivantes — aucun
// changement visible pour le visiteur.

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { NavProvider, useNav } from "@/lib/store";
import type {
  LaboFull,
  InitialArticlesPayload,
  ArticleDetailPayload,
  ViewName,
} from "@/lib/pipeline/types";
import { Header } from "./header";
import { Footer } from "./footer";
import { WhatsappFloat } from "./whatsapp-float";
import { HomeView } from "./home-view";
import { BlogView } from "./blog-view";
import { ArticleView } from "./article-view";
import { StudioView } from "./studio-view";
import { LaboView } from "./labo-view";
import { OutilsView } from "./outils-view";
import { PromosView } from "./promos-view";
import { ErrorBoundary } from "./error-boundary";

export interface InitialNav {
  view: ViewName;
  slug: string | null;
  silo: string | null;
  studioTab: string | null;
  outil: string | null;
}

// Sous-arbre des vues — consomme le store de navigation fourni par
// NavProvider (nécessaire : les vues appellent useNav()).
function Views() {
  const { view, syncFromUrl } = useNav();

  useEffect(() => {
    syncFromUrl();
    const onPop = () => syncFromUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <>
      <Header />
      <main id="contenu" className="flex-1 flex flex-col w-full">
        <ErrorBoundary view={view}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >
              {view === "home" && <HomeView />}
              {view === "blog" && <BlogView />}
              {view === "article" && <ArticleView />}
              {view === "studio" && <StudioView />}
              {view === "labo" && <LaboView />}
              {view === "outils" && <OutilsView />}
              {view === "promos" && <PromosView />}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      <Footer />
      <WhatsappFloat />
    </>
  );
}

export function AmensApp({
  initialLabo = null,
  initialArticles = null,
  initialArticleDetail = null,
  initialNav = null,
}: {
  initialLabo?: LaboFull | null;
  initialArticles?: InitialArticlesPayload | null;
  initialArticleDetail?: ArticleDetailPayload | null;
  initialNav?: InitialNav | null;
}) {
  const [queryClient] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      },
    });
    // Injection des données serveur : la clé ["labo"] correspond à useLabo(),
    // ["articles","all","published"] à useArticles() sans filtre.
    if (initialLabo) qc.setQueryData(["labo"], initialLabo);
    if (initialArticles) qc.setQueryData(["articles", "all", "published"], initialArticles);
    // Vue filtrée par silo (?v=blog&silo=…) : la clé filtrée reçoit la
    // sous-liste dès la création du client (pas de rechargement visible).
    if (initialArticles && initialNav?.silo) {
      qc.setQueryData(["articles", initialNav.silo, "published"], {
        articles: initialArticles.articles.filter((a) => a.silo === initialNav.silo),
        siloCounts: initialArticles.siloCounts,
      });
    }
    // Vue article : le contenu détaillé est déjà côté serveur — le HTML
    // servi contient l'article complet (lisible sans JavaScript).
    if (initialArticleDetail && initialNav?.view === "article" && initialNav.slug) {
      qc.setQueryData(["article", initialNav.slug], initialArticleDetail);
    }
    return qc;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <NavProvider initial={initialNav}>
          <div className="min-h-screen flex flex-col">
            <Views />
          </div>
        </NavProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
