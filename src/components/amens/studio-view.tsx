"use client";

// Studio Pipeline — LE registre : les 7 skills enregistrés dans le projet
// (dossier /skills), exécutés en chaîne. Tout futur contenu passe par eux :
// la publication est refusée si une seule gate échoue (cahier §4.2, §7.3).

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileCode2,
  FlaskConical,
  Info,
  Loader2,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Terminal,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNav } from "@/lib/store";
import { ANGLES } from "@/lib/pipeline/types";
import {
  useSkills,
  useRuns,
  useKeywords,
  usePipelineAnalyze,
  usePublishArticle,
  useKeywordResearch,
} from "@/hooks/use-amens";
import type { PipelineResult } from "@/lib/pipeline/types";

const STATUS_ICON: Record<string, React.ReactNode> = {
  passed: <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />,
  warned: <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />,
  blocked: <XCircle className="h-5 w-5 text-destructive" aria-hidden />,
  error: <XCircle className="h-5 w-5 text-destructive" aria-hidden />,
  skipped: <Info className="h-5 w-5 text-muted-foreground" aria-hidden />,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classe: string }> = {
    passed: { label: "PASSÉE", classe: "bg-primary/15 text-primary" },
    warned: { label: "AVERTIE", classe: "bg-accent/60 text-accent-foreground" },
    blocked: { label: "BLOQUÉE", classe: "bg-destructive/15 text-destructive" },
    error: { label: "ERREUR", classe: "bg-destructive/15 text-destructive" },
    skipped: { label: "IGNORÉE", classe: "bg-muted text-muted-foreground" },
    passed_run: { label: "PUBLIÉ", classe: "bg-primary/15 text-primary" },
    blocked_run: { label: "REFUSÉ", classe: "bg-destructive/15 text-destructive" },
  };
  const m = map[status] ?? map.skipped;
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${m.classe}`}>{m.label}</span>;
}

/* ── Registre des skills ─────────────────────────────────────────────────── */
function SkillsRegistry() {
  const { data, isLoading } = useSkills();
  if (isLoading) return <p className="py-8 text-center text-muted-foreground">Chargement du registre…</p>;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <Card className="border-primary/25 bg-secondary/30">
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed">
            <Lock className="mr-1.5 inline h-4 w-4 align-text-bottom text-primary" aria-hidden />
            <strong>Règle du projet :</strong> l&apos;ajout de tout futur contenu passe par ces
            skills enregistrés dans <code className="break-words font-mono text-xs">{data.pipelinePath}</code>.
            La publication est <strong>refusée</strong> si une seule gate échoue (jamais de
            contenu non validé).
          </p>
        </CardContent>
      </Card>
      <ol className="space-y-3">
        {data.skills.map((s) => (
          <li key={s.id}>
            <Card className="min-w-0">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {s.ordre}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold break-all">{s.slug}</p>
                      {s.gate && (
                        <Badge variant="outline" className="border-primary/50 text-[10px] text-primary">
                          <ShieldCheck className="mr-1 h-3 w-3" aria-hidden /> GATE
                        </Badge>
                      )}
                      {s.installed ? (
                        <Badge variant="outline" className="text-[10px] text-primary">
                          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden /> installé
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          manquant
                        </Badge>
                      )}
                      {s.active && <Badge variant="outline" className="text-[10px]">v{s.version} · actif</Badge>}
                    </div>
                    <p className="mt-1 text-sm font-medium">{s.mission}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                      <p className="flex min-w-0 items-start gap-1.5">
                        <FileCode2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        <code className="min-w-0 break-all font-mono">{s.skillPath}</code>
                      </p>
                      <p className="flex min-w-0 items-start gap-1.5">
                        <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        <code className="min-w-0 break-all font-mono">{s.scriptPath}</code>
                      </p>
                      {s.reference && (
                        <p className="flex min-w-0 items-start gap-1.5">
                          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="min-w-0 break-words">{s.reference}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 flex-row justify-between gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground sm:w-auto sm:flex-col sm:items-end sm:gap-1 sm:border-t-0 sm:pt-0">
                    <span>passées {s.stats.passed}</span>
                    <span>averties {s.stats.warned}</span>
                    <span>bloquées {s.stats.blocked}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Rapport d'exécution du pipeline ──────────────────────────────────────── */
function PipelineReport({ result }: { result: PipelineResult }) {
  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border p-4 ${
          result.canPublish
            ? "border-primary/40 bg-primary/5"
            : "border-destructive/40 bg-destructive/5"
        }`}
      >
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {result.canPublish ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
          )}
          <span>{result.canPublish ? "Contenu publiable" : "Publication refusée"}</span>
          <span className="text-sm text-muted-foreground sm:ml-auto">
            Score global {result.overallScore}/100 · {result.blockingIssues} bloquant(s) ·{" "}
            {result.warnings} avertissement(s)
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{result.verdict}</p>
      </div>
      <ol className="space-y-2">
        {result.steps.map((s) => (
          <li key={s.skillSlug}>
            <Card className={s.status === "blocked" || s.status === "error" ? "border-destructive/40" : s.status === "passed" ? "border-primary/30" : ""}>
              <CardContent className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_ICON[s.status]}
                  <span className="font-mono text-xs font-semibold">{s.skillSlug}</span>
                  {typeof s.score === "number" && (
                    <Badge variant="outline" className="text-[10px]">
                      {s.score}/100
                    </Badge>
                  )}
                  {s.gate && (
                    <Badge variant="outline" className="text-[10px] text-primary">
                      gate
                    </Badge>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {s.durationMs} ms
                  </span>
                </div>
                <p className="mt-1 text-sm">{s.summary}</p>
                {s.issues.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {s.issues.map((i, idx) => (
                      <li
                        key={idx}
                        className={`rounded-md px-2 py-1 text-xs ${
                          i.level === "BLOQUANT"
                            ? "bg-destructive/10 text-destructive"
                            : i.level === "AVERTISSEMENT"
                              ? "bg-accent/40 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        [{i.level}] {i.message}
                      </li>
                    ))}
                  </ul>
                )}
                {s.details && s.details.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Détails ({s.details.length})
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      {s.details.map((d, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          · {d}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Nouvel article : passe par les skills ────────────────────────────────── */
function NouvelArticle() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [angle, setAngle] = useState("1");
  const [requete, setRequete] = useState("");
  const [titre, setTitre] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [publie, setPublie] = useState<{ ok: boolean; message: string } | null>(null);

  const analyze = usePipelineAnalyze();
  const publish = usePublishArticle();

  const squelette = useMutation({
    mutationFn: (payload: { angle: number; requete: string; titre: string }) =>
      fetch("/api/squelette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Erreur squelette");
        return (await r.json()) as { squelette: string; console: string };
      }),
    onSuccess: (d) => {
      setContent(d.squelette);
      toast({
        title: "Squelette généré par pipeline-amens",
        description: "Gabarit §4.2, disclosure et blocs d'injection prêts à remplir.",
      });
    },
    onError: (e) => toast({ title: "Erreur squelette", description: e.message, variant: "destructive" }),
  });

  const charger = () => {
    if (!requete.trim() || !titre.trim()) {
      toast({
        title: "Champs manquants",
        description: "Requête cible et titre sont requis (brief étape 1 du pipeline).",
        variant: "destructive",
      });
      return;
    }
    squelette.mutate({ angle: Number(angle), requete: requete.trim(), titre: titre.trim() });
  };

  const lancer = (mode: "analyze" | "publish") => {
    if (!requete.trim() || !titre.trim() || !content.trim()) {
      toast({
        title: "Contenu incomplet",
        description: "Angle, requête cible, titre et contenu (markdown §4.2) sont requis.",
        variant: "destructive",
      });
      return;
    }
    setResult(null);
    setPublie(null);
    const payload = {
      angle: Number(angle),
      requete: requete.trim(),
      title: titre.trim(),
      content,
    };
    if (mode === "analyze") {
      analyze.mutate(payload, {
        onSuccess: (d) => setResult(d.pipeline),
        onError: (e) => toast({ title: "Erreur pipeline", description: e.message, variant: "destructive" }),
      });
    } else {
      publish.mutate(payload, {
        onSuccess: (d) => {
          setResult(d.pipeline);
          setPublie({
            ok: d.pipeline.canPublish,
            message: d.message,
          });
          toast({
            title: d.pipeline.canPublish ? "Article publié ✓" : "Publication refusée",
            description: d.message,
            variant: d.pipeline.canPublish ? undefined : "destructive",
          });
          qc.invalidateQueries({ queryKey: ["articles"] });
        },
        onError: (e) => toast({ title: "Erreur publication", description: e.message, variant: "destructive" }),
      });
    }
  };

  const enCours = analyze.isPending || publish.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="min-w-0 space-y-4">
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Brief (étape 1 — 5 champs obligatoires)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="angle">Angle d&apos;attaque (1-10)</Label>
              <Select value={angle} onValueChange={setAngle}>
                <SelectTrigger id="angle" className="h-11 w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANGLES.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.id}. {a.nom} ({a.pilier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requete">Requête cible (validée par blueocean-keywords)</Label>
              <Input
                id="requete"
                className="h-11"
                placeholder="ex. hébergeur qui accepte orange money"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titre">Titre (bénéfice concret)</Label>
              <Input
                id="titre"
                className="h-11"
                placeholder="ex. Héberger son site en payant avec Orange Money (guide 2026)"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2.5 sm:w-auto" onClick={charger} disabled={squelette.isPending}>
                {squelette.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                )}
                Générer le squelette (nouvel_article.py)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Contenu (markdown — gabarit §4.2 : conclusion 40-60 mots en tête, 8 sections, FAQ 5-8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              aria-label="Contenu de l'article en markdown"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Titre — bénéfice…&#10;&#10;Conclusion 40-60 mots : ce que le lecteur obtient…&#10;&#10;## 1. Ce qu'il te faut (prérequis)…"
              className="scroll-amens min-h-[320px] font-mono text-[13px] leading-relaxed sm:min-h-[420px]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button className="h-auto min-h-11 w-full whitespace-normal py-2.5 sm:w-auto" onClick={() => lancer("publish")} disabled={enCours}>
                {publish.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Play className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                )}
                Publier via le pipeline (gates obligatoires)
              </Button>
              <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2.5 sm:w-auto" onClick={() => lancer("analyze")} disabled={enCours}>
                <Zap className="mr-2 h-4 w-4 shrink-0" aria-hidden /> Analyser sans publier
              </Button>
              <span className="text-xs text-muted-foreground">
                {content.split(/\s+/).filter(Boolean).length} mots
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-4">
        {publie && (
          <Card className={publie.ok ? "border-primary/40" : "border-destructive/40"}>
            <CardContent className="p-4 text-sm">{publie.message}</CardContent>
          </Card>
        )}
        {enCours && (
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
              <div>
                <p className="font-medium">Pipeline en cours d&apos;exécution…</p>
                <p className="text-sm text-muted-foreground">
                  Les 7 skills tournent : blueocean-keywords → pipeline-amens → seo-ultra →
                  geo-citations-ia → humanisation-100 → suppression-traces-ia →
                  verification-contenu.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {result && !enCours && <PipelineReport result={result} />}
        {!result && !enCours && !publie && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Aucune exécution pour l&apos;instant.</p>
              <p className="mt-2">
                Le rapport des 7 skills apparaîtra ici : verdict blueocean, contrôle du gabarit
                §4.2, audit on-page, score de citabilité, marqueurs de style IA, traces Unicode,
                et la gate finale de vérification.
              </p>
              <ul className="mt-3 space-y-1 text-xs">
                <li>· Chaque prix doit porter sa date de relevé</li>
                <li>· ≥ 1 donnée Labo citée avec lien</li>
                <li>· ≥ 1 tableau chiffré, FAQ 5-8 questions</li>
                <li>· Disclosure §4.3 mot pour mot</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Recherche de mots-clés Blue Ocean ────────────────────────────────────── */
function MotsCles() {
  const { toast } = useToast();
  const [graine, setGraine] = useState("");
  const [angle, setAngle] = useState("3");
  const recherche = useKeywordResearch();
  const { data: stock } = useKeywords(Number(angle));

  const lancer = () => {
    if (!graine.trim()) {
      toast({ title: "Graine requise", description: "ex. « hébergeur cameroun »", variant: "destructive" });
      return;
    }
    recherche.mutate({ graine: graine.trim(), angle: Number(angle) });
  };

  const res = recherche.data?.result;

  return (
    <div className="space-y-4">
      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>Skill blueocean-keywords — autocomplete Google réel (sans clé API)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
            <Input
              className="h-11 min-w-0"
              placeholder="graine (ex. hébergeur cameroun, installer n8n…)"
              aria-label="Graine de recherche"
              value={graine}
              onChange={(e) => setGraine(e.target.value)}
            />
            <Select value={angle} onValueChange={setAngle}>
              <SelectTrigger className="h-11 w-full min-w-0" aria-label="Angle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANGLES.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.id}. {a.nom.split("(")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="h-11 w-full sm:w-auto" onClick={lancer} disabled={recherche.isPending}>
              {recherche.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Collecter"}
            </Button>
          </div>
          {res && (
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">{res.note}</p>
          )}
        </CardContent>
      </Card>

      {res && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {res.rows.length} requêtes — CIBLER {res.cibler} · SURVEILLER {res.surveiller} · IGNORER{" "}
              {res.ignorer}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (source : {res.source})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-amens max-h-96 w-full overflow-auto touch-pan-x">
              <table className="w-full min-w-[480px] text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="p-2">Requête</th>
                    <th className="p-2">Volume*</th>
                    <th className="p-2">KD proxy</th>
                    <th className="p-2">Rés. AIO</th>
                    <th className="p-2">Affil.</th>
                    <th className="p-2">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {res.rows.map((r) => (
                    <tr key={r.requete} className="border-b border-border/60">
                      <td className="p-2 font-medium">{r.requete}</td>
                      <td className="p-2">{r.classeVolume}</td>
                      <td className="p-2">{r.scoreDifficulte}</td>
                      <td className="p-2">{r.resistanceAio}</td>
                      <td className="p-2">{r.potentiel}</td>
                      <td className="p-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            r.verdict === "CIBLER"
                              ? "bg-primary/15 text-primary"
                              : r.verdict === "SURVEILLER"
                                ? "bg-accent/50 text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              *Classes d&apos;ordre de grandeur autocomplete — jamais de volume inventé : à
              valider GSC/Semrush/Ahrefs.
            </p>
          </CardContent>
        </Card>
      )}

      {stock && stock.rows.length > 0 && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Requêtes déjà capitalisées pour l&apos;angle {angle} ({stock.rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-amens max-h-96 w-full overflow-auto touch-pan-x">
              <table className="w-full min-w-[360px] text-xs">
                <tbody>
                  {stock.rows.map((r, i) => (
                    <tr key={r.requete + i} className="border-b border-border/60">
                      <td className="p-2 font-medium">{r.requete}</td>
                      <td className="p-2 whitespace-nowrap text-muted-foreground">KD {r.difficulte}</td>
                      <td className="p-2 whitespace-nowrap">
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            r.verdict === "CIBLER"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Historique des exécutions ────────────────────────────────────────────── */
function Historique() {
  const { data } = useRuns(25);
  const { navigate } = useNav();
  if (!data?.runs.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Aucune exécution enregistrée — chaque analyse/publication du Studio est tracée ici
          (skill par skill, score par score).
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {data.runs.map((r) => (
        <Card key={r.id} className="min-w-0">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status === "passed" ? "passed_run" : "blocked_run"} />
              <Badge variant="outline" className="text-[10px]">
                {r.runType === "publish" ? "publication" : "analyse"}
              </Badge>
              <p className="min-w-0 break-words text-sm font-medium">
                {r.title || r.requete}
                <span className="ml-2 font-normal text-muted-foreground">angle {r.angle}</span>
              </p>
              <span className="text-[11px] text-muted-foreground sm:ml-auto">
                {new Date(r.createdAt).toLocaleString("fr-FR")} · score {r.overallScore}/100
              </span>
            </div>
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {r.steps.map((s) => (
                <li
                  key={s.skillSlug}
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    s.status === "passed"
                      ? "bg-primary/10 text-primary"
                      : s.status === "warned"
                        ? "bg-accent/40 text-accent-foreground"
                        : "bg-destructive/10 text-destructive"
                  }`}
                  title={s.summary}
                >
                  {s.skillSlug.replace("-keywords", "").replace("ia", "IA")}{" "}
                  {typeof s.score === "number" ? s.score : ""}
                </li>
              ))}
            </ol>
            {r.blockingIssues > 0 && (
              <p className="mt-1 text-xs text-destructive">
                {r.blockingIssues} bloquant(s) — publication refusée
              </p>
            )}
            {r.slug && (
              <button
                type="button"
                className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => navigate({ view: "article", slug: r.slug })}
              >
                Voir l&apos;article <ChevronRight className="h-3 w-3" aria-hidden />
              </button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Vue Studio ───────────────────────────────────────────────────────────── */
export function StudioView() {
  const { studioTab } = useNav();
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Studio Pipeline</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Les 7 skills éditoriaux sont enregistrés dans le projet (dossier{" "}
          <code className="font-mono text-xs">skills/</code>) : recherche de mots-clés Blue
          Ocean, orchestration gabarit, SEO ultra, GEO citations IA, humanisation 100 %,
          suppression des traces IA et vérification finale. Tout contenu ajouté passe par
          eux — publication conditionnée aux gates.
        </p>
      </div>
      <Tabs defaultValue={studioTab ?? "registre"}>
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:inline-flex sm:w-fit sm:flex-wrap">
          <TabsTrigger value="registre" className="min-h-[44px] whitespace-normal text-center leading-tight">
            Registre des skills
          </TabsTrigger>
          <TabsTrigger value="nouveau" className="min-h-[44px] whitespace-normal text-center leading-tight">
            Nouvel article
          </TabsTrigger>
          <TabsTrigger value="keywords" className="min-h-[44px] whitespace-normal text-center leading-tight">
            Mots-clés Blue Ocean
          </TabsTrigger>
          <TabsTrigger value="runs" className="min-h-[44px] whitespace-normal text-center leading-tight">
            Historique
          </TabsTrigger>
        </TabsList>
        <TabsContent value="registre">
          <SkillsRegistry />
        </TabsContent>
        <TabsContent value="nouveau">
          <NouvelArticle />
        </TabsContent>
        <TabsContent value="keywords">
          <MotsCles />
        </TabsContent>
        <TabsContent value="runs">
          <Historique />
        </TabsContent>
      </Tabs>
    </div>
  );
}
