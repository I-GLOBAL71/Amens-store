"use client";

// Promos — Black Friday 2026 (J-4) : compte à rebours, vraies remises
// (renouvellements inclus), diffusion newsletter + WhatsApp hors SEO.
import { useEffect, useState } from "react";
import { Flame, Tag, TrendingDown, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLabo, useLead, usePrograms } from "@/hooks/use-amens";
import { usePageTitle } from "@/hooks/use-page-title";
import { DISCLOSURE } from "@/lib/pipeline/types";

// Black Friday 2026 : vendredi 27 novembre 2026
const BF_DATE = new Date("2026-11-27T00:00:00+01:00");

function useCountdown() {
  // now = null au premier rendu (serveur ET client) : aucun texte dépendant de
  // Date.now() n'est rendu avant le montage — évite toute erreur d'hydratation
  // (le HTML serveur doit correspondre au premier rendu client à l'octet près).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Premier tick différé (rAF) : pas de setState synchrone dans l'effet,
    // et « ·· » s'affiche un seul frame avant les vraies valeurs.
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);
  if (now === null) {
    return { jours: null, heures: null, minutes: null, secondes: null };
  }
  const diff = Math.max(BF_DATE.getTime() - now, 0);
  return {
    jours: Math.floor(diff / 86400000),
    heures: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    secondes: Math.floor((diff % 60000) / 1000),
  };
}

export function PromosView() {
  const c = useCountdown();
  const { data: labo } = useLabo();
  usePageTitle("Promos Black Friday et codes datés | amens.store");
  const { data: progs } = usePrograms({ angle: 1 });
  const lead = useLead();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const offres = (progs?.programs ?? []).slice(0, 6);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 min-w-0">
        <Badge className="mb-2 gap-1.5 bg-destructive py-1 text-white">
          <Flame className="h-3.5 w-3.5 shrink-0" aria-hidden /> Fenêtre Black Friday — J-4
        </Badge>
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          Black Friday 2026 hébergement : les vraies remises (renouvellement inclus)
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Chaque offre affiche le prix promo ET le prix de renouvellement relevé par le Labo —
          c&apos;est la différence entre une remise réelle et un piège à reconduction. Page
          mise à jour pendant tout le week-end BF/Cyber Monday.
        </p>
      </div>

      {/* Compte à rebours */}
      <Card className="mb-8 min-w-0 border-2 border-destructive/40">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-base font-semibold sm:text-lg">
              <Tag className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
              <span>Black Friday : vendredi 27 novembre 2026</span>
            </p>
            <div className="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto sm:gap-3" role="timer" aria-label="Compte à rebours Black Friday">
              {[
                { v: c.jours, l: "jours" },
                { v: c.heures, l: "heures" },
                { v: c.minutes, l: "min" },
                { v: c.secondes, l: "s" },
              ].map((u) => (
                <div key={u.l} className="min-w-0 rounded-lg bg-destructive/10 px-2 py-2 text-center sm:min-w-16 sm:px-3">
                  <p className="text-xl font-bold text-destructive tabular-nums sm:text-2xl">
                    {u.v === null ? "··" : String(u.v).padStart(2, "0")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{u.l}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Offres */}
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 shrink-0 text-primary" aria-hidden /> Offres suivies (Labo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {labo?.prix.slice(0, 5).map((p) => {
              const programme = offres.find((o) => o.name.toLowerCase().includes(p.host.toLowerCase().split(" ")[0]));
              return (
                <div key={p.host + p.plan} className="rounded-lg border border-border p-3.5 sm:p-4">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.host}</p>
                      <p className="text-xs text-muted-foreground">{p.plan}</p>
                    </div>
                    <div className="text-sm sm:text-right">
                      <p className="font-bold text-primary tabular-nums">
                        {p.prixPromo.toFixed(2)} {p.devise}/mois
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        renouvellement {p.prixRenouvellement.toFixed(2)} {p.devise}
                      </p>
                    </div>
                  </div>
                  {programme && (
                    <Button asChild size="sm" className="mt-3 h-auto min-h-11 w-full whitespace-normal py-2.5 sm:w-auto">
                      <a href={programme.trackingUrl} rel="sponsored noopener" target="_blank">
                        Profiter de l&apos;offre Black Friday
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
            <p className="text-[11px] italic text-muted-foreground">{DISCLOSURE}</p>
          </CardContent>
        </Card>

        {/* Newsletter + diffusion hors SEO */}
        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 shrink-0 text-primary" aria-hidden /> Alerte codes promo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Les codes sont envoyés en priorité par email et WhatsApp, puis partagés sur
                Telegram, Reddit et LinkedIn (groupes freelances et entrepreneurs
                francophones). L&apos;alerte email part en premier — inscris-toi pour la
                recevoir avant tout le monde.
              </p>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  lead.mutate(
                    { type: "newsletter", contact: email, angle: 6 },
                    {
                      onSuccess: (r) => {
                        toast({ title: "Inscrit ✓", description: r.message });
                        setEmail("");
                      },
                      onError: (err) =>
                        toast({ title: "Erreur", description: err.message, variant: "destructive" }),
                    }
                  );
                }}
              >
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.fr"
                  aria-label="Email pour l'alerte Black Friday"
                  className="h-11 min-w-0 flex-1"
                />
                <Button type="submit" className="h-11 shrink-0" disabled={lead.isPending}>
                  Recevoir les codes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Méthode (pourquoi nos remises sont «vraies»)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Prix promo relevé sur la page officielle, daté du jour.</li>
                <li>Prix de renouvellement relevé sur la même page (la faille F1).</li>
                <li>Taux de remise calculé sur les deux — pas seulement la promo.</li>
                <li>Recommandation seulement si l&apos;hébergeur passe le test Labo (uptime, latence).</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
