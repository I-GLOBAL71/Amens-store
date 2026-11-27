"use client";

// Labo — données propriétaires publiques : uptime, latence Afrique, prix de
// renouvellement. (Le suivi de visibilité IA reste en base — dashboard interne.)
import { Activity, Clock, Tag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabo } from "@/hooks/use-amens";
import { usePageTitle } from "@/hooks/use-page-title";

const REGIONS_LABEL: Record<string, string> = {
  europe: "Europe",
  "afrique-ouest": "Afrique de l'Ouest",
  "amerique-nord": "Amérique du Nord",
  douala: "Douala",
  abidjan: "Abidjan",
  dakar: "Dakar",
};

export function LaboView() {
  const { data, isLoading } = useLabo();
  usePageTitle("Le Labo amens.store — mesures publiques | amens.store");

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-6 h-10 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hosts = [...new Set(data.uptime.map((u) => u.host))];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 min-w-0">
        <Badge variant="outline" className="mb-2 border-primary/40 py-1 text-primary">
          <Activity className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Données mesurées · méthodologie publique</span>
        </Badge>
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          Le Labo amens.store — mesures publiques
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{data.kpi.methodologie}</p>
      </div>

      {/* KPI */}
      <div className="mb-8 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card className="min-w-0">
          <CardContent className="p-3.5 sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">Tarifs sous surveillance</span>
            </p>
            <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{data.prix.length}</p>
            <p className="text-xs text-muted-foreground">
              promos et renouvellements, relevé mensuel
            </p>
          </CardContent>
        </Card>
        {hosts.slice(0, 3).map((h) => (
          <Card key={h} className="min-w-0">
            <CardContent className="p-3.5 sm:p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 truncate">Uptime {h}</span>
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{data.kpi.avgUptime[h]?.toFixed(2)} %</p>
              <p className="text-xs text-muted-foreground">
                latence Afrique {data.kpi.latenceAfrique[h] ?? "—"} ms
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Uptime par hébergeur × région */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uptime 30 jours (ping 60 s · 3 régions)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-amens max-h-96 w-full overflow-auto touch-pan-x">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="p-2">Hébergeur</th>
                    <th className="p-2">Région</th>
                    <th className="p-2 whitespace-nowrap">Uptime</th>
                    <th className="p-2 whitespace-nowrap">Incidents 30 j</th>
                  </tr>
                </thead>
                <tbody>
                  {data.uptime.map((u, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="p-2 font-medium whitespace-nowrap">{u.host}</td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap">{REGIONS_LABEL[u.region] ?? u.region}</td>
                      <td
                        className={`p-2 font-semibold whitespace-nowrap tabular-nums ${u.uptime >= 99.9 ? "text-primary" : u.uptime >= 99.5 ? "text-amber-600" : "text-destructive"}`}
                      >
                        {u.uptime.toFixed(2)} %
                      </td>
                      <td className="p-2 whitespace-nowrap tabular-nums">{u.incidents30j || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Latence Afrique */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Latence depuis Douala, Abidjan, Dakar (nov. 2026)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hosts.map((h) => {
              const moyenne = data.kpi.latenceAfrique[h] ?? 0;
              const max = Math.max(...Object.values(data.kpi.latenceAfrique), 1);
              return (
                <div key={h} className="min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{h}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{moyenne} ms</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        moyenne < 200 ? "bg-primary" : moyenne < 300 ? "bg-amber-500" : "bg-destructive/70"
                      }`}
                      style={{ width: `${Math.max((moyenne / max) * 100, 4)}%` }}
                      role="img"
                      aria-label={`Latence moyenne ${moyenne} millisecondes pour ${h}`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Prix renouvellement */}
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>Prix promo vs renouvellement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-amens max-h-96 w-full overflow-auto touch-pan-x">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="p-2">Hébergeur</th>
                    <th className="p-2">Plan</th>
                    <th className="p-2 whitespace-nowrap">Promo</th>
                    <th className="p-2 whitespace-nowrap">Renouv.</th>
                    <th className="p-2 whitespace-nowrap">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prix.map((p, i) => {
                    const ecart = Math.round(
                      ((p.prixRenouvellement - p.prixPromo) / p.prixPromo) * 100
                    );
                    return (
                      <tr key={i} className="border-b border-border/60">
                        <td className="p-2 font-medium whitespace-nowrap">{p.host}</td>
                        <td className="p-2 text-muted-foreground">{p.plan}</td>
                        <td className="p-2 whitespace-nowrap tabular-nums">
                          {p.prixPromo.toFixed(2)} {p.devise}
                        </td>
                        <td className="p-2 whitespace-nowrap tabular-nums">
                          {p.prixRenouvellement.toFixed(2)} {p.devise}
                        </td>
                        <td
                          className={`p-2 font-semibold whitespace-nowrap tabular-nums ${ecart >= 100 ? "text-destructive" : "text-amber-600"}`}
                        >
                          +{ecart} %
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Relevés du 15/11/2026 sur les pages tarifs officielles — veille mensuelle avec
              alertes sur hausses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
