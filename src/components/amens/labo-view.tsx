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
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Badge variant="outline" className="mb-2 border-primary/40 text-primary">
          <Activity className="mr-1 h-3.5 w-3.5" aria-hidden /> Données mesurées · méthodologie publique
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Le Labo amens.store — mesures publiques
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{data.kpi.methodologie}</p>
      </div>

      {/* KPI */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Tag className="h-4 w-4 text-primary" aria-hidden /> Tarifs sous surveillance
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{data.prix.length}</p>
            <p className="text-xs text-muted-foreground">
              promos et renouvellements, relevé mensuel
            </p>
          </CardContent>
        </Card>
        {hosts.slice(0, 3).map((h) => (
          <Card key={h}>
            <CardContent className="p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" aria-hidden /> Uptime {h}
              </p>
              <p className="mt-1 text-2xl font-bold">{data.kpi.avgUptime[h]?.toFixed(2)} %</p>
              <p className="text-xs text-muted-foreground">
                latence Afrique {data.kpi.latenceAfrique[h] ?? "—"} ms
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Uptime par hébergeur × région */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uptime 30 jours (ping 60 s · 3 régions)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-amens max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="p-2">Hébergeur</th>
                    <th className="p-2">Région</th>
                    <th className="p-2">Uptime</th>
                    <th className="p-2">Incidents 30 j</th>
                  </tr>
                </thead>
                <tbody>
                  {data.uptime.map((u, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="p-2 font-medium">{u.host}</td>
                      <td className="p-2 text-muted-foreground">{REGIONS_LABEL[u.region] ?? u.region}</td>
                      <td
                        className={`p-2 font-semibold ${u.uptime >= 99.9 ? "text-primary" : u.uptime >= 99.5 ? "text-amber-600" : "text-destructive"}`}
                      >
                        {u.uptime.toFixed(2)} %
                      </td>
                      <td className="p-2">{u.incidents30j || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Latence Afrique */}
        <Card>
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
                <div key={h}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{h}</span>
                    <span className="text-muted-foreground">{moyenne} ms</span>
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
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Prix promo vs renouvellement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-amens max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="p-2">Hébergeur</th>
                    <th className="p-2">Plan</th>
                    <th className="p-2">Promo</th>
                    <th className="p-2">Renouv.</th>
                    <th className="p-2">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prix.map((p, i) => {
                    const ecart = Math.round(
                      ((p.prixRenouvellement - p.prixPromo) / p.prixPromo) * 100
                    );
                    return (
                      <tr key={i} className="border-b border-border/60">
                        <td className="p-2 font-medium">{p.host}</td>
                        <td className="p-2 text-muted-foreground">{p.plan}</td>
                        <td className="p-2">
                          {p.prixPromo.toFixed(2)} {p.devise}
                        </td>
                        <td className="p-2">{p.prixRenouvellement.toFixed(2)} {p.devise}</td>
                        <td
                          className={`p-2 font-semibold ${ecart >= 100 ? "text-destructive" : "text-amber-600"}`}
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
