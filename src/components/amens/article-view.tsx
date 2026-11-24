"use client";

// Vue article — structure GEO : conclusion en tête (bloc citable 134-167 mots),
// fil d'Ariane, TOC, CTA affilié §7.3 (résolu depuis la DB + tracking UTM),
// maillage (même silo + inter-silos), JSON-LD Article + FAQPage + Breadcrumb.
import { useEffect, useMemo } from "react";
import {
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Clock,
  Info,
  ListTree,
  Pencil,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useNav } from "@/lib/store";
import { angleById, DISCLOSURE } from "@/lib/pipeline/types";
import { useArticle } from "@/hooks/use-amens";
import { usePageTitle } from "@/hooks/use-page-title";
import { Markdown } from "./markdown";

/* TOC depuis les H2 du markdown */
function extraireToc(content: string) {
  return content
    .split("\n")
    .filter((l) => /^##\s+/.test(l.trim()))
    .map((l) => {
      const titre = l.replace(/^##\s+/, "").trim();
      const id = titre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      return { titre, id };
    });
}

export function ArticleView() {
  const { slug, navigate } = useNav();
  const { data, isLoading, error } = useArticle(slug);

  const article = data?.article;
  const angle = article ? angleById(article.angle) : null;

  usePageTitle(
    article
      ? `${article.metaTitle || article.title} | amens.store`
      : "Guide | amens.store"
  );

  // Meta description dynamique (invisible : pour moteurs et agents IA)
  useEffect(() => {
    if (!article?.metaDescription) return;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", article.metaDescription);
  }, [article]);

  const toc = useMemo(() => (article ? extraireToc(article.content) : []), [article]);

  // JSON-LD Article + FAQPage + BreadcrumbList — rendu DANS l'arbre JSX :
  // présent dans le HTML servi côté serveur (lisible par les agents IA sans
  // JavaScript), et automatiquement resynchronisé à chaque navigation SPA.
  const jsonLd = useMemo(() => {
    if (!article) return null;
    return [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.metaDescription,
        author: { "@type": "Organization", name: "amens.store" },
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        mainEntityOfPage: `https://amens.store/?v=article&slug=${encodeURIComponent(article.slug)}`,
      },
      ...(article.faq.length
        ? [
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: article.faq.slice(0, 8).map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ]
        : []),
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: "https://amens.store/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://amens.store/?v=blog" },
          {
            "@type": "ListItem",
            position: 3,
            name: `/${article.silo}/`,
            item: `https://amens.store/?v=blog&silo=${article.silo}`,
          },
          { "@type": "ListItem", position: 4, name: article.title },
        ],
      },
    ];
  }, [article]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-4 h-10 w-2/3" />
        <Skeleton className="mb-8 h-5 w-1/3" />
        <Skeleton className="mb-3 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
        <p className="text-lg font-semibold">Article introuvable</p>
        <Button className="mt-4" onClick={() => navigate({ view: "blog" })}>
          Retour au blog
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* JSON-LD rendu côté serveur — lisible sans JavaScript */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-muted-foreground">
        <button className="hover:text-primary" onClick={() => navigate({ view: "home" })}>
          Accueil
        </button>
        <span className="mx-1">/</span>
        <button className="hover:text-primary" onClick={() => navigate({ view: "blog" })}>
          Blog
        </button>
        <span className="mx-1">/</span>
        <button className="hover:text-primary" onClick={() => navigate({ view: "blog", silo: article.silo })}>
          /{article.silo}/
        </button>
        <span className="mx-1">/</span>
        <span aria-current="page" className="font-medium text-foreground">
          {article.title.slice(0, 40)}…
        </span>
      </nav>

      {/* En-tête */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="border-primary/40 text-[11px]" variant="outline">
            {angle ? angle.nom.split("(")[0] : `/${article.silo}/`}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {article.difficulty}
            {article.timeEstimate ? ` · ${article.timeEstimate}` : ""}
            {article.costEstimate ? ` · ${article.costEstimate}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            mis à jour{" "}
            {new Date(article.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-muted-foreground">{article.metaDescription}</p>
        {article.verificationPassed && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Guide relu et vérifié —
            dernière révision en date affichée ci-dessus
          </p>
        )}
      </div>

      {/* TOC */}
      {toc.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ListTree className="h-4 w-4 text-primary" aria-hidden /> Au programme
            </p>
            <ol className="scroll-amens max-h-56 space-y-1 overflow-y-auto text-sm">
              {toc.map((t, i) => (
                <li key={t.id + i}>
                  <button
                    className="text-muted-foreground hover:text-primary hover:underline"
                    onClick={() =>
                      document
                        .getElementById(t.id)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    {t.titre}
                  </button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Corps de l'article (conclusion en tête — gabarit §4.2).
          Le H1 du markdown est retiré : il est déjà rendu dans l'en-tête
          ci-dessus (un seul H1 par page — règle seo-ultra). */}
      <Markdown
        content={article.content.replace(/^#\s+[^\n]+\n/, "")}
      />

      <Separator className="my-8" />

      {/* CTA affilié (résolu DB §7.3 : primaire + alternatives + UTM) */}
      <Card className="border-2 border-primary/30 bg-secondary/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" aria-hidden />
            {angle?.cta ?? "Passer à l'action"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.primaryProgram ? (
            <>
              <p className="text-sm text-muted-foreground">
                Notre recommandation testée dans le Labo :{" "}
                <strong>{data.primaryProgram.name}</strong>
                {data.alternatives.length > 0 && (
                  <>
                    {" "}· alternative(s) éprouvée(s) :{" "}
                    {data.alternatives.map((a) => a.name).join(", ")}
                  </>
                )}
                .
              </p>
              <a href={data.primaryProgram.trackingUrl} rel="sponsored noopener" target="_blank">
                <Button size="lg" className="mt-3 h-12 w-full text-base sm:w-auto">
                  {angle?.cta ?? "Voir l'offre"} <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Button>
              </a>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {DISCLOSURE}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Programme partenaire en cours de sélection pour ce guide — contacte-nous sur
              WhatsApp.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Maillage interne */}
      <section className="mt-8" aria-labelledby="maillage-titre">
        <h2 id="maillage-titre" className="mb-3 text-lg font-semibold">
          Sur le même sujet
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...(data?.maillage.silo ?? []), ...(data?.maillage.inter ?? [])].slice(0, 4).map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate({ view: "article", slug: a.slug })}
            >
              <CardContent className="p-4">
                <Badge variant="outline" className="mb-1 text-[10px]">
                  /{a.silo}/
                </Badge>
                <p className="text-sm font-semibold leading-snug">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Aide contextuelle */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" aria-hidden />
          Données Labo citées dans ce guide : méthode publique (ping 60 s, 3 régions, veille mensuelle des prix).
        </p>
        <button
          className="inline-flex items-center gap-1 hover:text-primary"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-4 w-4" aria-hidden /> Haut de page
        </button>
      </div>
    </div>
  );
}
