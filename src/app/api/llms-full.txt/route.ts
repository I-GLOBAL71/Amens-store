// GET /api/llms-full.txt (servi aussi à /llms-full.txt via next.config.ts) —
// corpus complet en markdown des guides publiés, données Labo et FAQ pour les
// moteurs de réponse IA (protocole GEO, invisible côté visiteur).
import { db } from "@/lib/db";
import { ANGLES } from "@/lib/pipeline/types";
import { loadLaboData } from "@/lib/labo-data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function cleanBodyForLlms(md: string): string {
  // Retire le frontmatter éventuel et le premier H1 (remplacé par ## [Titre] + URL canonique)
  const stripped = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return stripped.replace(/^#\s+[^\n]+\r?\n+/, "").trim();
}

export async function GET() {
  const [articles, labo] = await Promise.all([
    db.article.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    }),
    loadLaboData().catch(() => null),
  ]);

  const sections: string[] = [
    "# amens.store : corpus intégral des guides et mesures Labo",
    "",
    `> Guide francophone de mise en ligne : projets IA auto-hébergés, vibe coding, Mobile Money sans carte bancaire, email pro, coûts sur 36 mois et migration. Version concise : ${SITE_URL}/llms.txt`,
    "",
  ];

  if (labo) {
    sections.push("## Mesures récentes du Labo amens.store (novembre 2026)", "");
    for (const [host, uptime] of Object.entries(labo.kpi.avgUptime)) {
      const lat = labo.kpi.latenceAfrique[host];
      sections.push(
        `- ${host} : disponibilité moyenne ${uptime.toFixed(2)} %${lat ? `, latence Afrique observée ${Math.round(lat)} ms` : ""}`
      );
    }
    sections.push("");
  }

  for (const art of articles) {
    const angle = ANGLES.find((a) => a.id === art.angle);
    const url = `${SITE_URL}/?v=article&slug=${encodeURIComponent(art.slug)}`;
    sections.push(
      `## ${art.title}`,
      `URL canonique : ${url}`,
      `Silo : /${art.silo}/ (${angle ? angle.nom : "Guide"}) · Difficulté : ${art.difficulty} · Durée : ${art.timeEstimate} · Budget indicatif : ${art.costEstimate}`,
      `Synthèse : ${art.metaDescription || art.excerpt}`,
      "",
      cleanBodyForLlms(art.content),
      ""
    );
  }

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
