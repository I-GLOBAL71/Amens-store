// Audit profond du contenu publié : exporte le contenu RÉEL de la DB
// (source de vérité du rendu visiteur/IA) et lui applique les vrais scripts
// des skills enregistrés :
//   - humanisation-100     → analyse_style.py (marqueurs IA, variation, triptymes)
//   - suppression-traces-ia→ nettoyer_unicode.py --inspecter (zero-width, bidi…)
//   - geo-citations-ia     → score_citabilite.py (blocs 134-167 mots, dates…)
//   - verification-contenu → check_contenu.py --monetise (placeholders, liens vides…)
// Usage : bun run scripts/audit-contenu.ts
import path from "path";
import { db } from "../src/lib/db";
import { runPy, SCRIPTS, writeTmp, cleanupTmp } from "../src/lib/pipeline/py";

interface AuditRow {
  slug: string;
  silo: string;
  status: string;
  words: number;
  // humanisation
  marqueursIa: number;
  marqueursDetail: string[];
  variation: number | null;
  triptymes: number | null;
  debutsRepetes: string | null;
  verdictHumain: boolean;
  // traces
  tracesSuspects: number;
  // geo
  geoScore: number | null;
  geoDetails: string[];
  // verification
  bloquants: number | null;
  avertissements: number | null;
  verifIssues: string[];
}

async function auditArticle(slug: string, content: string): Promise<AuditRow> {
  const stamp = `audit-${slug.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`;
  const file = await writeTmp(`${stamp}.md`, content);

  // 1. Humanisation
  const hum = await runPy(SCRIPTS.humanStyle, [file]);
  const markerMatches = [...hum.stdout.matchAll(/×(\d+)\s+«\s*([^»]+)\s*»/g)];
  const marqueursDetail = markerMatches.map((m) => `« ${m[2].trim()} » ×${m[1]}`);
  const variation = hum.stdout.match(/variation\s+([\d.]+)/)?.[1] ?? null;
  const triptymes = hum.stdout.match(/Triptymes parallèles\s*:\s*(\d+)/)?.[1] ?? null;
  const debutsRepetes = hum.stdout.match(/Débuts de paragraphes répétés \(≥3×\) : (.+)/)?.[1] ?? null;
  const verdictHumain = hum.stdout.includes("HUMAIN probable");
  const impers = hum.stdout.match(/impersonnelles \([^)]*\) : (\d+)/)?.[1] ?? null;
  if (impers) marqueursDetail.push(`tournures impersonnelles: ${impers}`);

  // 2. Traces IA (inspection seule, pas de modification)
  const traces = await runPy(SCRIPTS.tracesUnicode, [file, "--inspecter"]);
  const aucun = traces.stdout.includes("aucun caractère suspect détecté");
  const nbMatch = traces.stdout.match(/===\s*(\d+)\s*caractère\(s\) suspect\(s\)/);
  const tracesSuspects = aucun ? 0 : nbMatch ? Number(nbMatch[1]) : -1;

  // 3. GEO citabilité
  const geo = await runPy(SCRIPTS.geoScore, [file]);
  const geoScore = geo.stdout.match(/Score de citabilité\s*:\s*(\d+)\/100/)?.[1] ?? null;
  const geoDetails = geo.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("✓") || l.startsWith("~") || l.startsWith("✗"));

  // 4. Vérification contenu
  const verif = await runPy(SCRIPTS.verification, [file, "--monetise"]);
  const vm = verif.stdout.match(/:\s*(\d+)\s*bloquant\(s\),\s*(\d+)\s*avertissement\(s\)/);
  const verifIssues = [...verif.stdout.matchAll(/\[\s*(BLOQUANT|AVERTISSEMENT)\s*\]\s*(.*)/g)].map(
    (m) => `[${m[1]}] ${m[2].trim()}`
  );

  await cleanupTmp(stamp);

  return {
    slug,
    silo: "",
    status: "",
    words: content.split(/\s+/).length,
    marqueursIa: markerMatches.reduce((a, m) => a + Number(m[1]), 0),
    marqueursDetail,
    variation: variation ? Number(variation) : null,
    triptymes: triptymes ? Number(triptymes) : null,
    debutsRepetes,
    verdictHumain,
    tracesSuspects,
    geoScore: geoScore ? Number(geoScore) : null,
    geoDetails,
    bloquants: vm ? Number(vm[1]) : null,
    avertissements: vm ? Number(vm[2]) : null,
    verifIssues,
  };
}

async function main() {
  const articles = await db.article.findMany({
    orderBy: { publishedAt: "desc" },
    select: { slug: true, silo: true, status: true, content: true, title: true },
  });
  console.log(`Audit de ${articles.length} article(s) en base (tous statuts).\n`);

  const rows: AuditRow[] = [];
  for (const a of articles) {
    const row = await auditArticle(a.slug, a.content);
    row.silo = a.silo;
    row.status = a.status;
    rows.push(row);
    console.log(`· ${a.slug} [${a.status}] — humain=${row.verdictHumain} marqueurs=${row.marqueursIa} variation=${row.variation} traces=${row.tracesSuspects} geo=${row.geoScore} verif=${row.bloquants}b/${row.avertissements}a`);
  }

  console.log("\n================ RAPPORT DÉTAILLÉ ================\n");
  for (const r of rows) {
    console.log(`── ${r.slug} [${r.status}] (${r.words} mots)`);
    console.log(`   Humanisation : verdict ${r.verdictHumain ? "HUMAIN probable" : "style IA détectable"} · marqueurs IA ${r.marqueursIa} · variation ${r.variation} · triptymes ${r.triptymes}${r.debutsRepetes ? " · débuts répétés: " + r.debutsRepetes : ""}`);
    if (r.marqueursDetail.length) r.marqueursDetail.forEach((d) => console.log(`      - ${d}`));
    console.log(`   Traces IA    : ${r.tracesSuspects} caractère(s) suspect(s)`);
    console.log(`   GEO          : score ${r.geoScore}/100`);
    r.geoDetails.forEach((d) => console.log(`      ${d}`));
    console.log(`   Vérification : ${r.bloquants} bloquant(s), ${r.avertissements} avertissement(s)`);
    r.verifIssues.forEach((d) => console.log(`      ${d}`));
    console.log("");
  }

  // Synthèse JSON pour exploitation
  const fs = await import("fs");
  fs.writeFileSync(
    path.join(process.cwd(), ".pipeline-tmp", "audit-contenu.json"),
    JSON.stringify(rows, null, 2),
    "utf-8"
  );
  console.log("Rapport JSON : .pipeline-tmp/audit-contenu.json");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
