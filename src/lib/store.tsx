"use client";

// Navigation SPA — unique route visible : / (état dans l'URL : ?v=…&slug=…&silo=…)
// pour que chaque vue/article ait une URL partageable, indexable et citable.
//
// ARCHITECTURE SSR-SÛRE : le store est créé PAR RENDU (par requête côté
// serveur, par hydratation côté client) AVEC son état initial dérivé de
// l'URL côté serveur (page.tsx → searchParams), puis fourni via contexte.
// — aucune mutation de store pendant le rendu (anti-pattern useSyncExternalStore) ;
// — aucun état résiduel d'une requête à l'autre (le store n'est plus un
//   singleton module-level) ;
// — le HTML servi pour /?v=article&slug=… est celui de l'article.

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { ViewName } from "@/lib/pipeline/types";

export interface NavPatch {
  view?: ViewName;
  slug?: string | null;
  silo?: string | null;
  studioTab?: string | null;
  outil?: string | null;
  anchor?: string | null;
}

interface NavState extends NavPatch {
  view: ViewName;
  slug: string | null;
  silo: string | null;
  studioTab: string | null;
  outil: string | null;
  navigate: (patch: NavPatch) => void;
  syncFromUrl: () => void;
}

const VIEWS: ViewName[] = ["home", "blog", "article", "studio", "labo", "outils", "promos"];

function readUrl(): NavPatch {
  if (typeof window === "undefined") return { view: "home" };
  const p = new URLSearchParams(window.location.search);
  const v = (p.get("v") as ViewName | null) ?? "home";
  return {
    view: VIEWS.includes(v) ? v : "home",
    slug: p.get("slug"),
    silo: p.get("silo"),
    studioTab: p.get("tab"),
    outil: p.get("outil"),
  };
}

export function createNavStore(initial?: NavPatch | null) {
  return createStore<NavState>((set, get) => ({
    view: "home",
    slug: null,
    silo: null,
    studioTab: null,
    outil: null,
    ...initial,
    navigate: (patch) => {
      const prev = get();
      const view = patch.view ?? prev.view;
      // Assainissement des paramètres par vue : un paramètre non fourni
      // explicitement n'est conservé que s'il appartient à la vue CIBLE
      // (ex. le slug d'un article ne survit pas à un retour au blog). URLs
      // propres, cohérentes avec les canoniques et le sitemap.
      const slug =
        patch.slug !== undefined ? patch.slug : view === "article" ? prev.slug : null;
      const silo =
        patch.silo !== undefined ? patch.silo : view === "blog" ? prev.silo : null;
      const studioTab =
        patch.studioTab !== undefined
          ? patch.studioTab
          : view === "studio"
            ? prev.studioTab
            : null;
      const outil =
        patch.outil !== undefined ? patch.outil : view === "outils" ? prev.outil : null;
      const next = { ...prev, ...patch, view, slug, silo, studioTab, outil } as NavState;
      set({ view, slug, silo, studioTab, outil });
      if (typeof window !== "undefined") {
        const params = new URLSearchParams();
        if (next.view !== "home") params.set("v", next.view);
        if (next.slug) params.set("slug", next.slug);
        if (next.silo) params.set("silo", next.silo);
        if (next.studioTab) params.set("tab", next.studioTab);
        if (next.outil) params.set("outil", next.outil);
        const qs = params.toString();
        const url = `${window.location.pathname}${qs ? "?" + qs : ""}`;
        window.history.pushState({}, "", url);
        if (patch.anchor) {
          requestAnimationFrame(() => {
            document.getElementById(patch.anchor!)?.scrollIntoView({ behavior: "smooth" });
          });
        } else {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      }
    },
    syncFromUrl: () => {
      set(readUrl());
    },
  }));
}

const NavContext = createContext<StoreApi<NavState> | null>(null);

// Fournisseur du store de navigation : créé une fois par montage, avec
// l'état initial de l'URL (rendu serveur de la vue/article demandée).
export function NavProvider({
  initial,
  children,
}: {
  initial?: NavPatch | null;
  children: ReactNode;
}) {
  const [store] = useState(() => createNavStore(initial));
  return <NavContext.Provider value={store}>{children}</NavContext.Provider>;
}

export function useNav() {
  const store = useContext(NavContext);
  if (!store) {
    throw new Error("useNav doit être utilisé à l'intérieur de <NavProvider>");
  }
  return useStore(store, (s) => s);
}
