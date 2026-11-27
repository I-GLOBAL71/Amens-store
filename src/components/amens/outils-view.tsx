"use client";

// Outils aimants à trafic (angle 4) — calculateurs interactifs :
// « Quel serveur pour mon projet IA ? » + « Le vrai coût sur 3 ans ».
import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Cpu, HardDrive, MemoryStick, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNav } from "@/lib/store";
import { usePrograms, useLabo } from "@/hooks/use-amens";
import { usePageTitle } from "@/hooks/use-page-title";

/* ── Calculateur « Quel serveur pour mon projet IA ? » (angle 1) ──────────── */
const APPS: Record<string, { label: string; ramBase: number; cpu: number }> = {
  n8n: { label: "n8n (workflows)", ramBase: 2, cpu: 1 },
  ollama: { label: "Ollama (LLM local)", ramBase: 0, cpu: 2 },
  "open-webui": { label: "Open WebUI", ramBase: 1, cpu: 1 },
  dify: { label: "Dify", ramBase: 4, cpu: 2 },
  flowise: { label: "Flowise", ramBase: 1, cpu: 1 },
  coolify: { label: "Coolify (PaaS)", ramBase: 2, cpu: 2 },
  librechat: { label: "LibreChat", ramBase: 2, cpu: 1 },
  metabase: { label: "Metabase", ramBase: 2, cpu: 1 },
};

const MODELES: Record<string, { label: string; ram: number; note: string }> = {
  none: { label: "— pas de LLM local —", ram: 0, note: "automatisations/API uniquement" },
  "llama-8b": { label: "Llama 3.1 8B (Q4)", ram: 6, note: "~5 Go de poids quantifié" },
  "mistral-7b": { label: "Mistral 7B (Q4)", ram: 5, note: "~4,4 Go quantifié" },
  "qwen-14b": { label: "Qwen 2.5 14B (Q4)", ram: 10, note: "gros esprit, RAM en conséquence" },
  "llama-70b": { label: "Llama 3.3 70B (Q4)", ram: 42, note: "défie la plupart des VPS — dédié" },
  whisper: { label: "Whisper medium", ram: 3, note: "transcription audio" },
  "stable-diffusion": { label: "Stable Diffusion SDXL", ram: 12, note: "+ VRAM idéalement" },
};

const PLANS: { nom: string; ram: number; cpu: string; prix: string; url: string }[] = [
  { nom: "VPS 4 Go (KVM1)", ram: 4, cpu: "1 vCPU", prix: "≈ 4,50 €/mois", url: "" },
  { nom: "VPS 8 Go (KVM2)", ram: 8, cpu: "2 vCPU", prix: "≈ 5,99 €/mois promo (13,99 € renouv.)", url: "" },
  { nom: "VPS 16 Go (KVM4)", ram: 16, cpu: "4 vCPU", prix: "≈ 12,99 €/mois promo", url: "" },
  { nom: "VPS 32 Go", ram: 32, cpu: "8 vCPU", prix: "≈ 25,99 €/mois promo", url: "" },
  { nom: "Dédié 64+ Go", ram: 64, cpu: "8 cœurs+", prix: "sur devis", url: "" },
];

function CalculateurRam() {
  const [app, setApp] = useState("n8n");
  const [modele, setModele] = useState("none");
  const { data: prog } = usePrograms({ context: "vps_ia" });
  const reco = prog?.programs?.[0];

  const besoin = useMemo(() => {
    const base = APPS[app]?.ramBase ?? 1;
    const llm = MODELES[modele]?.ram ?? 0;
    const docker = 1; // OS + Docker
    const total = base + llm + docker;
    const plan = PLANS.find((p) => p.ram >= total) ?? PLANS[PLANS.length - 1];
    return { base, llm, docker, total, plan };
  }, [app, modele]);

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MemoryStick className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span>Quel serveur pour mon projet IA ?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid min-w-0 gap-2">
            <Label>Application à auto-héberger</Label>
            <Select value={app} onValueChange={setApp}>
              <SelectTrigger className="h-11 w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Modèle (si LLM local)</Label>
            <Select value={modele} onValueChange={setModele}>
              <SelectTrigger className="h-11 w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODELES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-sm text-muted-foreground">Besoin total estimé</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {besoin.total} Go RAM
            <span className="ml-2 text-base font-medium text-muted-foreground">
              {besoin.plan.cpu}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {APPS[app]?.label} ({besoin.base} Go) + modèle ({besoin.llm} Go) + OS/Docker (
            {besoin.docker} Go). {MODELES[modele]?.note}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-sm font-medium">
              Plan recommandé : <strong>{besoin.plan.nom}</strong> · {besoin.plan.prix}
            </p>
            {reco && (
              <Button asChild className="h-11 w-full sm:w-auto">
                <a href={reco.trackingUrl} rel="sponsored noopener" target="_blank">
                  Créer mon VPS <ArrowRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
                </a>
              </Button>
            )}
          </div>
          {reco && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Lien d&apos;affiliation ({reco.name}, commission pour nous, sans surcoût pour toi).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Calculateur « Le vrai coût sur 3 ans » (faille F1) ───────────────────── */
function VraiCout() {
  const { data: labo } = useLabo();
  const [promo, setPromo] = useState("2.49");
  const [renouv, setRenouv] = useState("7.99");
  const [mois, setMois] = useState("36");

  const total = useMemo(() => {
    const p = parseFloat(promo.replace(",", ".")) || 0;
    const r = parseFloat(renouv.replace(",", ".")) || 0;
    const m = parseInt(mois) || 12;
    // Hypothèse cahier des charges : promo 12 mois (Black Friday) puis renouvellement
    const moisPromo = Math.min(12, m);
    const moisRenouv = Math.max(0, m - 12);
    return {
      promo: p * moisPromo,
      renouv: r * moisRenouv,
      total: p * moisPromo + r * moisRenouv,
      ecart: p > 0 ? Math.round(((r - p) / p) * 100) : 0,
    };
  }, [promo, renouv, mois]);

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span>Le vrai coût sur 3 ans (renouvellement inclus)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="promo">Prix promo (€/mois)</Label>
            <Input id="promo" className="h-11" value={promo} onChange={(e) => setPromo(e.target.value)} inputMode="decimal" />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="renouv">Prix renouvellement (€/mois)</Label>
            <Input id="renouv" className="h-11" value={renouv} onChange={(e) => setRenouv(e.target.value)} inputMode="decimal" />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="mois">Durée (mois)</Label>
            <Select value={mois} onValueChange={setMois}>
              <SelectTrigger id="mois" className="h-11 w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["12", "24", "36", "48"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m} mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-sm text-muted-foreground">Coût réel total</p>
          <p className="mt-1 text-3xl font-bold text-primary tabular-nums">
            {total.total.toFixed(2).replace(".", ",")} €
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            dont {total.promo.toFixed(2).replace(".", ",")} € en promo (12 premiers mois) et{" "}
            {total.renouv.toFixed(2).replace(".", ",")} € au renouvellement (+{total.ecart} % à
            la hausse).
          </p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${(total.promo / Math.max(total.total, 1)) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            La faille F1 : les comparateurs affichent le prix promo, le portefeuille paie le
            renouvellement.
          </p>
        </div>

        {/* Presets Labo */}
        {labo && (
          <div className="scroll-amens max-h-48 w-full overflow-auto touch-pan-x rounded-md border border-border/60">
            <table className="w-full min-w-[380px] text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left">
                  <th className="p-2">Hébergeur (relevé 15/11/2026)</th>
                  <th className="p-2 whitespace-nowrap">Promo</th>
                  <th className="p-2 whitespace-nowrap">Renouv.</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {labo.prix.map((p, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">{p.host} — {p.plan}</td>
                    <td className="p-2 whitespace-nowrap tabular-nums">{p.prixPromo.toFixed(2)} €</td>
                    <td className="p-2 whitespace-nowrap tabular-nums">{p.prixRenouvellement.toFixed(2)} €</td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        className="inline-flex min-h-[36px] items-center rounded-md bg-secondary px-2.5 py-1 font-medium text-primary hover:underline"
                        onClick={() => {
                          setPromo(String(p.prixPromo));
                          setRenouv(String(p.prixRenouvellement));
                        }}
                      >
                        Charger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Vue Outils ───────────────────────────────────────────────────────────── */
export function OutilsView() {
  const { navigate } = useNav();
  usePageTitle("Outils et calculateurs gratuits | amens.store");
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 min-w-0">
        <Badge variant="outline" className="mb-2 border-primary/40 py-1 text-primary">
          <Cpu className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Outils gratuits · résultats instantanés</span>
        </Badge>
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          Les outils qui calculent ce que les comparateurs cachent
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Calculateur de serveur pour projets IA, vrai coût sur 3 ans — les données viennent
          du Labo (relevés datés). Résultats instantanés, aucune inscription requise.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CalculateurRam />
        <VraiCout />
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <Timer className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm font-medium">
              D&apos;autres outils arrivent : « Qui héberge ce site ? », vérificateur DNS/SSL,
              « Mon site est-il en panne ? ».
            </p>
          </div>
          <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => navigate({ view: "blog" })}>
            Lire les guides associés <ArrowRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
