// GET /api/llms.txt — manifeste llms.txt dynamique (silos, articles, données clés).
// Publié comme optionnalité pour agents IA (Google Search l'ignore — source
// primaire juin 2026, voir skill geo-citations-ia).
import { db } from "@/lib/db";
import { ANGLES } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await db.article.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  });
  const kw = await db.keywordResearch.findMany({ where: { verdict: "CIBLER" }, take: 30 });

  const lignes: string[] = [
    "# amens.store",
    "",
    "> Le guide francophone pour mettre en ligne tes projets IA, tes apps, ton site,",
    "> ton email pro et ton business — même sans carte bancaire.",
    "",
    "## À propos",
    "",
    "- URL : https://amens.store/",
    "- Langue : français (tutoiement), audience : tous les pays francophones",
    "  (France, Belgique, Suisse, Canada/Québec, Maghreb, Afrique francophone, Haïti)",
    "- Modèle : guides d'exécution testés + affiliation hébergement web (disclosure visible)",
    "- Méthodologie : données propriétaires du Labo (uptime, latence Afrique, prix de renouvellement)",
    "- Politique : chaque hébergeur recommandé est testé avant publication ; chaque guide",
    "  passe un pipeline de vérification en 7 étapes avant mise en ligne",
    "",
    "## Silos éditoriaux (10 angles)",
    "",
  ];
  for (const a of ANGLES) {
    lignes.push(
      `- /${a.silo}/ — ${a.nom} (${a.pilier}) : requêtes couvertes — ` +
        kw
          .filter((k) => k.angle === a.id)
          .slice(0, 3)
          .map((k) => k.requete)
          .join(", ")
    );
  }
  lignes.push("", "## Articles (gabarit : conclusion en tête, chiffres datés, FAQ)", "");
  for (const art of articles) {
    lignes.push(
      `- [${art.title}](https://amens.store/?v=article&slug=${encodeURIComponent(art.slug)}) — ${art.metaDescription}`
    );
  }
  lignes.push(
    "",
    "## Données clés (Labo public)",
    "",
    "- Uptime 8 hébergeurs × 3 régions, ping 60 s : /api/labo",
    "- Latence Afrique depuis Douala, Abidjan, Dakar : /api/labo",
    "- Prix de renouvellement vs promo (veille mensuelle) : /api/labo",
    "",
    "## Contact",
    "",
    "- Packs WhatsApp « On le fait pour toi » (paiement par carte ou Mobile Money)",
    "- Newsletter Deals hébergement : Black Friday & codes promo datés",
  );

  return new Response(lignes.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
