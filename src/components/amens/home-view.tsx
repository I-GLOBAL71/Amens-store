"use client";

// Accueil — hero, assistant « 3 questions → ton hébergeur », 10 angles, stats Labo.
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  Activity,
  Briefcase,
  Building2,
  Cpu,
  Globe,
  Mail,
  Rocket,
  Sparkles,
  Tag,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNav } from "@/lib/store";
import { ANGLES } from "@/lib/pipeline/types";
import { useArticles, useLabo, usePrograms } from "@/hooks/use-amens";
import { usePageTitle } from "@/hooks/use-page-title";
import { NavLink } from "./nav-link";

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  rocket: Rocket,
  globe: Globe,
  wrench: Wrench,
  "arrow-right-left": ArrowRightLeft,
  tag: Tag,
  mail: Mail,
  activity: Activity,
  briefcase: Briefcase,
  building: Building2,
};

/* ── Assistant « 3 questions → ton hébergeur » (conversion directe) ───────── */
function Assistant() {
  const { navigate } = useNav();
  const [step, setStep] = useState(0);
  const [projet, setProjet] = useState<string | null>(null);
  const [paiement, setPaiement] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);

  const contexte =
    projet === "ia" || projet === "app" ? "vps_ia" : projet === "email" ? "email" : projet === "agence" ? "agence" : "mutualise";
  const geo = paiement === "mobile" ? "africa" : undefined;
  const { data, isLoading } = usePrograms(
    step === 3 ? { context: contexte, ...(geo ? { geo } : {}), enabled: true } : { enabled: false }
  );

  const reco = useMemo(() => {
    if (!data?.programs?.length) return null;
    const liste = [...data.programs].sort((a, b) => b.priorityScore - a.priorityScore);
    // géo-ciblage Afrique : Mobile Money prioritaire (règle §7.3 angle 3)
    if (geo) {
      const africa = liste.filter((p) => p.geoTarget === "africa");
      if (africa.length) return { principal: africa[0], alt: liste.filter((p) => p.slug !== africa[0].slug).slice(0, 2) };
    }
    return { principal: liste[0], alt: liste.slice(1, 3) };
  }, [data, geo]);

  const projets = [
    { id: "ia", label: "Auto-héberger une IA (n8n, Ollama…)" },
    { id: "app", label: "Mettre en ligne une app vibe-codée" },
    { id: "site", label: "Créer le site de mon business/asso" },
    { id: "email", label: "Un email pro sur mon domaine" },
    { id: "agence", label: "Héberger les sites de mes clients" },
  ];
  const paiements = [
    { id: "carte", label: "Carte bancaire / PayPal" },
    { id: "mobile", label: "Mobile Money (sans carte)" },
  ];
  const budgets = [
    { id: "small", label: "≤ 5 € / ~3 000 FCFA par mois" },
    { id: "mid", label: "5–15 € / mois" },
    { id: "large", label: "15 € et + (VPS performant)" },
  ];

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden border-2 border-primary/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg leading-snug">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span>Assistant — 3 questions, ton hébergeur</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col min-w-0">
        {step === 0 && (
          <div className="flex flex-1 flex-col">
            <p className="mb-3 text-sm text-muted-foreground">1/3 · Ton projet ?</p>
            <div className="grid gap-2">
              {projets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProjet(p.id);
                    setStep(1);
                  }}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-secondary"
                >
                  <span className="min-w-0">{p.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              ))}
            </div>
            <div className="mt-auto border-t border-border pt-4">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Au bout des 3 questions : l&apos;hébergeur testé le mieux adapté + le guide
                  pas-à-pas. Paiement Mobile Money (Orange Money, MTN MoMo, Wave) accepté —
                  aucune carte bancaire requise.
                </span>
              </p>
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">2/3 · Comment veux-tu payer ?</p>
              <button
                type="button"
                className="min-h-[36px] px-2 text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => setStep(0)}
              >
                ← Retour
              </button>
            </div>
            <div className="grid gap-2">
              {paiements.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPaiement(p.id);
                    setStep(2);
                  }}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-secondary"
                >
                  <span className="min-w-0">{p.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">3/3 · Ton budget mensuel ?</p>
              <button
                type="button"
                className="min-h-[36px] px-2 text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => setStep(1)}
              >
                ← Retour
              </button>
            </div>
            <div className="grid gap-2">
              {budgets.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBudget(b.id);
                    setStep(3);
                  }}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-secondary"
                >
                  <span className="min-w-0">{b.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Recommandation</p>
              <button
                type="button"
                className="min-h-[36px] px-2 text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => {
                  setStep(0);
                  setProjet(null);
                  setPaiement(null);
                  setBudget(null);
                }}
              >
                Recommencer
              </button>
            </div>
            {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Calcul…</p>}
            {!isLoading && !reco && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-secondary/50 p-5 text-center sm:p-6">
                <p className="text-sm font-medium">Recommandation momentanément indisponible</p>
                <p className="text-xs text-muted-foreground">
                  Les données Labo n&apos;ont pas pu être chargées. Recharge la page, ou explore
                  directement les guides du blog.
                </p>
                <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => navigate({ view: "blog" })}>
                  Voir tous les guides
                </Button>
              </div>
            )}
            {reco && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-primary/40 bg-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{reco.principal.name}</p>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      testé Labo
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {reco.principal.geoTarget === "africa"
                      ? "Paiement Mobile Money accepté — sans carte bancaire."
                      : reco.principal.context === "email"
                        ? "Email pro sur ton nom de domaine, SPF/DKIM inclus."
                        : "Guide testé dans notre Labo avant recommandation."}
                  </p>
                  <Button asChild className="mt-3 h-auto min-h-11 w-full whitespace-normal py-2.5 sm:w-auto">
                    <a href={reco.principal.trackingUrl} rel="sponsored noopener" target="_blank">
                      {ANGLE_CTA(contexte)} <ArrowRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
                    </a>
                  </Button>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    Lien d&apos;affiliation — commission pour nous, sans surcoût pour toi.
                  </p>
                </div>
                {reco.alt.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Alternatives testées :</p>
                    <ul className="space-y-1">
                      {reco.alt.map((a) => (
                        <li key={a.slug} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate">{a.name}</span>
                          <a
                            href={a.trackingUrl}
                            rel="sponsored noopener"
                            target="_blank"
                            className="inline-flex min-h-[36px] shrink-0 items-center px-1 text-xs font-medium text-primary underline"
                          >
                            Voir
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <NavLink
                  target={{
                    view: "blog",
                    silo: projet === "ia" ? "ia-automatisation" : projet === "app" ? "deployer-mon-app" : projet === "email" ? "email-pro" : projet === "agence" ? "agences" : "metiers",
                  }}
                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary underline"
                >
                  Lire nos guides sur ce sujet →
                </NavLink>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex gap-1" aria-label="Progression de l'assistant">
          {/* 3 segments = 3 questions : la barre reste alignée sur « 1/3 · … » */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${step >= i ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ANGLE_CTA(contexte: string): string {
  switch (contexte) {
    case "email":
      return "Créer mon email pro";
    case "agence":
      return "Calculer ma marge";
    default:
      return "Créer mon hébergement";
  }
}

/* ── Vue accueil ──────────────────────────────────────────────────────────── */
export function HomeView() {
  usePageTitle(
    "amens.store — mets en ligne tes projets IA, apps et business (même sans carte bancaire)"
  );
  const { data: labo } = useLabo();
  const { data: articlesData } = useArticles();
  const nbArticles = articlesData?.articles.length ?? 0;

  const stats = [
    { label: "Guides testés en ligne", value: `${nbArticles}`, sub: "réponse dès les premières lignes, chiffres datés" },
    {
      label: "Uptime moyen Labo (8 hébergeurs)",
      value: labo
        ? `${(Object.values(labo.kpi.avgUptime).reduce((a, b) => a + b, 0) / Math.max(Object.keys(labo.kpi.avgUptime).length, 1)).toFixed(2)} %`
        : "…",
      sub: "sites témoins, surveillance continue",
    },
    {
      label: "Tarifs d’hébergement suivis",
      value: labo ? `${labo.prix.length}` : "…",
      sub: "promos et renouvellements, relevé mensuel",
    },
    {
      label: "Latence mesurée depuis Douala",
      value: labo ? `${Math.round(Object.values(labo.kpi.latenceAfrique)[0] ?? 0)} ms` : "…",
      sub: "sites témoins, relevé nov. 2026",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/70 to-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-4 max-w-full gap-1.5 border-primary/40 py-1 text-primary">
              <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Guides testés · prix datés · données Labo publiques</span>
            </Badge>
            <h1 className="break-words text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Mets en ligne tes projets IA, tes apps, ton site et ton email pro —{" "}
              <span className="text-primary">même sans carte bancaire.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-5 sm:text-lg">
              amens.store n&apos;est pas un comparateur. C&apos;est un guide d&apos;exécution : tu arrives
              avec un projet précis (installer n8n, déployer une app Lovable, payer en Orange
              Money, créer un email pro), tu repars avec une solution opérationnelle.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="h-12 w-full sm:w-auto" asChild>
                <NavLink target={{ view: "blog" }}>
                  Explorer le blog <ArrowRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
                </NavLink>
              </Button>
              <Button size="lg" variant="outline" className="h-12 w-full sm:w-auto" asChild>
                <NavLink target={{ view: "labo" }}>
                  Voir les données du Labo
                </NavLink>
              </Button>
            </div>
            <ul className="mt-7 grid gap-2.5 text-sm text-muted-foreground sm:mt-8 sm:grid-cols-2">
              {[
                "Chaque hébergeur testé avant recommandation",
                "Prix réels sur 12–36 mois (renouvellements inclus)",
                "Paiement Mobile Money : Orange Money, MTN MoMo, Wave",
                "Guides et prix revus chaque mois — jamais de conseils périmés",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Assistant />
        </div>
      </section>

      {/* Stats Labo */}
      <section aria-label="Indicateurs du Labo" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-7 min-[360px]:grid-cols-2 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <p className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10 angles */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12" aria-labelledby="angles-titre">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 id="angles-titre" className="text-2xl font-bold tracking-tight">
              Tous nos guides, par projet
            </h2>
            <p className="mt-1 text-muted-foreground">
              De l&apos;auto-hébergement d&apos;une IA au pack WhatsApp pour l&apos;école du
              quartier : chaque sujet a son guide pas-à-pas, testé et daté.
            </p>
          </div>
          <Button variant="outline" className="h-11 w-full sm:w-auto shrink-0" asChild>
            <NavLink target={{ view: "blog" }}>
              Tous les guides <ArrowRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
            </NavLink>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ANGLES.map((a) => {
            const Icone = ICONES[a.icone] ?? Cpu;
            return (
              <NavLink
                key={a.id}
                target={{ view: "blog", silo: a.silo }}
                className="group block h-full min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Card className="h-full min-w-0 cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Icone className="h-5 w-5 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base leading-tight">{a.nom}</CardTitle>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        /{a.silo}/
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                      {a.cta} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </p>
                  </CardContent>
                </Card>
              </NavLink>
            );
          })}
        </div>
      </section>

      {/* Confiance & fraîcheur (règles éditoriales appliquées dans le pipeline, invisibles ici) */}
      <section className="border-t border-border bg-card" aria-labelledby="confiance-titre">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 id="confiance-titre" className="text-2xl font-bold tracking-tight">
              Des guides que tu peux exécuter en confiance
            </h2>
            <p className="mt-2 text-muted-foreground">
              Chaque hébergeur recommandé est d&apos;abord utilisé dans notre Labo ; chaque prix
              est relevé à la date affichée ; chaque étape est reproduite pas à pas avant
              publication. Et quand une donnée change, le guide est révisé — la date de mise
              à jour est indiquée sur chaque page.
            </p>
            <Button className="mt-4 h-11 w-full sm:w-auto" asChild>
              <NavLink target={{ view: "labo" }}>
                Voir les mesures du Labo <ArrowRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
              </NavLink>
            </Button>
          </div>
          <div className="min-w-0 rounded-xl border border-border bg-background p-4 sm:p-5">
            <ul className="space-y-3">
              {[
                ["Testé avant d'être recommandé", "chaque hébergeur tourne dans le Labo avant d'apparaître dans un guide"],
                ["Prix réels, renouvellements inclus", "promos et tarifs de renouvellement suivis chaque mois"],
                ["Réponse dès la première ligne", "conclusion d'abord, étapes ensuite, chiffres sourcés"],
                ["Révisé en continu", "date de mise à jour affichée sur chaque guide"],
              ].map(([titre, detail]) => (
                <li key={titre} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{titre}</p>
                    <p className="text-sm text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
