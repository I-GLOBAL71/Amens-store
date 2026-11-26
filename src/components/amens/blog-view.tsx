"use client";

// Blog — hub des sujets, recherche et cartes guides. La qualité éditoriale
// (vérification avant publication) est appliquée côté serveur, invisible ici.
import { useMemo, useState } from "react";
import { Search, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNav } from "@/lib/store";
import { ANGLES, angleById } from "@/lib/pipeline/types";
import { useArticles } from "@/hooks/use-amens";
import { usePageTitle } from "@/hooks/use-page-title";
import { NavLink } from "./nav-link";
import { getArticleCoverPath, getArticleCoverProxyPath } from "@/lib/article-image";

export function BlogView() {
  const { silo, navigate } = useNav();
  const [q, setQ] = useState("");
  const angleSelectionne = ANGLES.find((a) => a.silo === silo);
  usePageTitle(
    angleSelectionne
      ? `${angleSelectionne.nom} | amens.store`
      : "Le blog — guides d'exécution testés | amens.store"
  );

  const { data, isLoading } = useArticles({ silo: silo ?? undefined });

  const articles = useMemo(() => {
    const liste = data?.articles ?? [];
    if (!q.trim()) return liste;
    const needle = q.toLowerCase();
    return liste.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        a.excerpt.toLowerCase().includes(needle) ||
        a.content.toLowerCase().includes(needle)
    );
  }, [data, q]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      {/* En-tête blog */}
      <div className="mb-6">
        <nav aria-label="Fil d'Ariane" className="mb-2 text-xs text-muted-foreground">
          <NavLink target={{ view: "home" }} className="hover:text-primary">
            Accueil
          </NavLink>
          <span className="mx-1">/</span>
          <span aria-current="page">Blog</span>
          {angleSelectionne && (
            <>
              <span className="mx-1">/</span>
              <span aria-current="page">/{angleSelectionne.silo}/</span>
            </>
          )}
        </nav>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {angleSelectionne ? angleSelectionne.nom : "Le blog — guides d'exécution testés"}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {angleSelectionne
            ? angleSelectionne.description
            : "Chaque guide donne la réponse dès les premières lignes, s’appuie sur des mesures du Labo et affiche des prix datés — promo et renouvellement. Objectif : 170 guides sur 6 mois."}
        </p>
      </div>

      {/* Filtres silos */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par sujet">
        <NavLink
          target={{ view: "blog", silo: null }}
          className={`inline-flex items-center min-h-[40px] rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
            !silo ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          Tous les sujets
        </NavLink>
        {ANGLES.map((a) => (
          <NavLink
            key={a.id}
            target={{ view: "blog", silo: a.silo }}
            ariaPressed={silo === a.silo}
            className={`inline-flex items-center min-h-[40px] rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
              silo === a.silo
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            /{a.silo}/
          </NavLink>
        ))}
      </div>

      {/* Recherche + requêtes ciblées */}
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un guide (n8n, Orange Money, email pro…)"
            aria-label="Rechercher dans le blog"
            className="h-11 pl-9"
          />
        </div>
      </div>

      {/* Grille articles */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">Aucun guide publié dans ce sujet pour l&apos;instant</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Les guides arrivent au rythme de 3 à 5 par semaine. En attendant, parcoure
              les autres sujets ou pose ta question via le bouton WhatsApp en bas à droite.
            </p>
            <Button onClick={() => navigate({ view: "blog", silo: null })} variant="outline">
              Parcourir tous les guides
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => {
            const angle = angleById(a.angle);
            return (
              <NavLink
                key={a.id}
                target={{ view: "article", slug: a.slug }}
                className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Card className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md">
                  <div className="w-full overflow-hidden border-b border-border bg-slate-950">
                    <img
                      src={getArticleCoverPath(a.slug)}
                      alt={a.title}
                      width={1200}
                      height={630}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const proxy = getArticleCoverProxyPath(a.slug);
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = "1";
                          img.src = proxy;
                        }
                      }}
                      className="aspect-[1200/630] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
                    <Badge variant="outline" className="border-primary/40 text-[11px] text-primary">
                      /{a.silo}/
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("fr-FR") : "brouillon"}
                    </span>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <CardTitle className="text-base leading-snug group-hover:text-primary">
                      {a.title}
                    </CardTitle>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {a.verificationPassed && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          <Sparkles className="h-3 w-3" aria-hidden /> relu et vérifié
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {angle?.nom.split("(")[0]} · {a.difficulty}
                        {a.timeEstimate ? ` · ${a.timeEstimate}` : ""}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                  </CardContent>
                </Card>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
