// Chargement serveur des données Labo (uptime, latence, prix, citations IA)
// + agrégats KPI — partagé entre GET /api/labo et le rendu SSR de la page
// d'accueil (les stats s'affichent avec les vraies valeurs dès le premier
// HTML, sans placeholder « … », même sur connexion lente).

import { db } from "@/lib/db";
import type { LaboFull } from "@/lib/pipeline/types";

export async function loadLaboData(): Promise<LaboFull> {
  const [uptime, latence, prix, citations] = await Promise.all([
    db.laboUptime.findMany({ orderBy: [{ host: "asc" }, { region: "asc" }] }),
    db.laboLatence.findMany({ orderBy: [{ host: "asc" }, { region: "asc" }] }),
    db.priceHistory.findMany({ orderBy: { host: "asc" } }),
    db.aiCitation.findMany({ orderBy: { checkedAt: "desc" } }),
  ]);

  const data = {
    uptime: uptime.map((u) => ({
      host: u.host,
      region: u.region,
      uptime: u.uptime,
      incidents30j: u.incidents30j,
      lastCheckAt: u.lastCheckAt.toISOString(),
    })),
    latence: latence.map((l) => ({
      host: l.host,
      region: l.region,
      latenceMs: l.latenceMs,
      period: l.period,
    })),
    prix: prix.map((p) => ({
      host: p.host,
      plan: p.plan,
      prixPromo: p.prixPromo,
      prixRenouvellement: p.prixRenouvellement,
      devise: p.devise,
      captureAt: p.captureAt.toISOString(),
    })),
    citations: citations.map((c) => ({
      plateforme: c.plateforme,
      requete: c.requete,
      cite: c.cite,
      checkedAt: c.checkedAt.toISOString(),
    })),
  };

  // Agrégats KPI
  const citees = data.citations.filter((c) => c.cite).length;
  const hosts = [...new Set(data.uptime.map((u) => u.host))];
  const avgUptime: Record<string, number> = {};
  for (const h of hosts) {
    const rows = data.uptime.filter((u) => u.host === h);
    avgUptime[h] = Math.round((rows.reduce((a, r) => a + r.uptime, 0) / rows.length) * 100) / 100;
  }
  const latenceAfrique: Record<string, number> = {};
  for (const h of hosts) {
    const rows = data.latence.filter((l) => l.host === h);
    if (rows.length) {
      latenceAfrique[h] = Math.round(rows.reduce((a, r) => a + r.latenceMs, 0) / rows.length);
    }
  }

  return {
    ...data,
    kpi: {
      citationRate: Math.round((citees / Math.max(data.citations.length, 1)) * 1000) / 10,
      citationRateDetail: `${citees}/${data.citations.length} requêtes`,
      cibleMois3: 10,
      cibleMois6: 30,
      avgUptime,
      latenceAfrique,
      methodologie:
        "8 sites témoins identiques hébergés chez 8 hébergeurs, ping 60 s depuis 3 régions (Europe, Afrique de l'Ouest, Amérique du Nord), latence mesurée depuis Douala, Abidjan et Dakar, veille mensuelle des prix de renouvellement.",
    },
  };
}
