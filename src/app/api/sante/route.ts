// GET /api/sante — bilan de santé interne de la plateforme (aucun lien visible
// côté visiteur : endpoint réservé à la sentinelle anti-régression
// scripts/regression-check.ts et à la veille cron quotidienne).
// La réponse est toujours 200 : c'est le champ "status" qui porte le verdict
// ("ok" | "degrade") pour rester monitorable sans provoquer d'alerte HTTP.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadLaboData } from "@/lib/labo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const controls: { name: string; ok: boolean; detail: string }[] = [];

  try {
    const total = await db.article.count({ where: { status: "published" } });
    controls.push({ name: "articles-publies", ok: total > 0, detail: `${total} articles publiés` });
  } catch (e) {
    controls.push({ name: "articles-publies", ok: false, detail: `BDD injoignable : ${String(e).slice(0, 120)}` });
  }

  try {
    const labo = await loadLaboData();
    controls.push({
      name: "labo",
      ok:
        labo.uptime.length > 0 &&
        labo.latence.length > 0 &&
        labo.prix.length > 0 &&
        Object.keys(labo.kpi.avgUptime).length > 0,
      detail: `${labo.uptime.length} mesures uptime, ${labo.latence.length} latences, ${labo.prix.length} tarifs`,
    });
  } catch (e) {
    controls.push({ name: "labo", ok: false, detail: `Chargement Labo impossible : ${String(e).slice(0, 120)}` });
  }

  try {
    const programmes = await db.affiliateProgram.count({ where: { active: true } });
    controls.push({ name: "programmes-affiliation", ok: programmes > 0, detail: `${programmes} programmes actifs` });
  } catch (e) {
    controls.push({ name: "programmes-affiliation", ok: false, detail: String(e).slice(0, 120) });
  }

  const ok = controls.every((c) => c.ok);
  return NextResponse.json({
    status: ok ? "ok" : "degrade",
    at: new Date().toISOString(),
    controls,
  });
}
