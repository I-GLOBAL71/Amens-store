#!/usr/bin/env bun
/**
 * Audit unifié Rang S+ (5 piliers sur 100 pts) + détection de duplication
 * inter-articles pour amens.store (importé et adapté de b2bpro.store).
 *
 * Piliers :
 *  1. SEO Fondamental (30 pts)
 *  2. GEO & Citabilité IA (25 pts)
 *  3. Zéro Trace d'IA & Style Humain (25 pts)
 *  4. CRO & Transparence Affiliation (10 pts)
 *  5. Intégrité Technique & Mobile-First (10 pts)
 *
 * Usage : bun run scripts/verify-splus.ts
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { checkGabarit } from "../src/lib/pipeline/gabarit";
import { runPy, SCRIPTS, writeTmp, cleanupTmp } from "../src/lib/pipeline/py";
import { DISCLOSURE } from "../src/lib/pipeline/types";

interface SPlusRow {
  file: string;
  words: number;
  seo: number;
  geo: number;
  human: number;
  cro: number;
  mobile: number;
  total: number;
  grade: "S+" | "A" | "B" | "C" | "F";
  warnings: string[];
  criticals: string[];
}

function normSentence(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractSentences(md: string): string[] {
  const withoutDisclosure = md.replaceAll(DISCLOSURE, "");
  const prose = withoutDisclosure.replace(/```[\s\S]*?```/g, "").replace(/^#+\s.*$/gm, "");
  return prose
    .split(/(?<=[.!?…])\s+/)
    .map((s) => normSentence(s))
    .filter((s) => s.length >= 60 && !s.startsWith("|"));
}

async function auditFile(file: string, content: string): Promise<SPlusRow> {
  const warnings: string[] = [];
  const criticals: string[] = [];
  const words = content.split(/\s+/).filter(Boolean).length;
  const h1 = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
  const h2Count = (content.match(/^##\s+/gm) ?? []).length;

  // 1. SEO (30 pts)
  let seo = 0;
  if (h1.length >= 35 && h1.length <= 85) seo += 8;
  else if (h1.length > 0) {
    seo += 4;
    warnings.push(`H1 hors 35-85 car. (${h1.length})`);
  } else criticals.push("H1 absent");

  if (words >= 1200) seo += 8;
  else if (words >= 800) seo += 5;
  else criticals.push(`Article court (${words} mots)`);

  if (h2Count >= 8) seo += 7;
  else if (h2Count >= 3) seo += 4;
  else criticals.push(`${h2Count} H2 (< 3)`);

  const internalLinks = (content.match(/\]\(\/[a-z0-9-]+\/?\)/gi) ?? []).length;
  if (internalLinks >= 2) seo += 7;
  else if (internalLinks >= 1) seo += 4;
  else warnings.push("Maillage interne faible (< 2 liens)");

  // 2. GEO (25 pts) — exécute score_citabilite.py
  const stamp = `splus-${file.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`;
  const tmpFile = await writeTmp(`${stamp}.md`, content);
  const geoRes = await runPy(SCRIPTS.geoScore, [tmpFile]);
  const geoRaw = Number(geoRes.stdout.match(/Score de citabilité\s*:\s*(\d+)\/100/)?.[1] ?? "0");
  const geo = Math.round((geoRaw / 100) * 25);
  if (geoRaw < 60) warnings.push(`Score GEO ${geoRaw}/100 (< 60)`);

  // 3. Humanisation & Traces IA (25 pts) — exécute analyse_style.py + nettoyer_unicode.py
  const humRes = await runPy(SCRIPTS.humanStyle, [tmpFile]);
  const traceRes = await runPy(SCRIPTS.tracesUnicode, [tmpFile, "--inspecter"]);
  const verifRes = await runPy(SCRIPTS.verification, [tmpFile, "--monetise"]);
  await cleanupTmp(stamp);

  let human = 25;
  const markers = [...humRes.stdout.matchAll(/×(\d+)\s+«\s*([^»]+)\s*»/g)].reduce(
    (a, m) => a + Number(m[1]),
    0
  );
  if (markers > 0) {
    human -= Math.min(15, markers * 5);
    criticals.push(`${markers} marqueur(s) lexical(aux) IA`);
  }
  if (!humRes.stdout.includes("HUMAIN probable")) {
    human -= 4;
    warnings.push("Verdict stylistique non optimal");
  }
  if (!traceRes.stdout.includes("aucun caractère suspect détecté")) {
    human -= 10;
    criticals.push("Caractères Unicode invisibles ou homoglyphes détectés");
  }
  const emCount = (content.match(/—/g) ?? []).length;
  if (emCount > 2) {
    human -= 1;
    warnings.push(`${emCount} cadratins (—) : privilégier virgules/parenthèses (règle b2bpro)`);
  }
  human = Math.max(0, human);

  // 4. CRO & Transparence (10 pts)
  let cro = 0;
  if (content.includes(DISCLOSURE)) cro += 4;
  else criticals.push("Disclosure §4.3 absente");
  if (content.includes('rel="sponsored"') && content.includes("utm_content=")) cro += 4;
  else criticals.push("Lien affilié canonique absent");
  if (/(\d+[.,]\d+|\d+)\s*(€|FCFA|\$)/.test(content)) cro += 2;
  else warnings.push("Ancrage tarifaire absent");

  // 5. Intégrité & Mobile-First (10 pts)
  let mobile = 10;
  const fences = (content.match(/```/g) ?? []).length;
  if (fences % 2 !== 0) {
    mobile -= 6;
    criticals.push("Bloc de code markdown non fermé (risque débordement mobile)");
  }
  if (!verifRes.stdout.includes("OK pour relecture humaine")) {
    mobile -= 4;
    criticals.push("Échec gate verification-contenu");
  }
  const gab = checkGabarit(content, 1);
  if (!gab.details.some((d) => d.includes("Tableau"))) {
    mobile -= 2;
    warnings.push("Tableau comparatif manquant");
  }
  mobile = Math.max(0, mobile);

  const total = Math.min(100, seo + geo + human + cro + mobile);
  const grade: SPlusRow["grade"] =
    criticals.length > 0
      ? "F"
      : total >= 95
        ? "S+"
        : total >= 85
          ? "A"
          : total >= 75
            ? "B"
            : "C";

  return { file, words, seo, geo, human, cro, mobile, total, grade, warnings, criticals };
}

async function main() {
  const dir = path.join(process.cwd(), "content", "articles");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  const sentenceOwners = new Map<string, Set<string>>();
  const rows: SPlusRow[] = [];

  for (const f of files) {
    const content = readFileSync(path.join(dir, f), "utf-8");
    for (const s of extractSentences(content)) {
      const set = sentenceOwners.get(s) ?? new Set<string>();
      set.add(f);
      sentenceOwners.set(s, set);
    }
    rows.push(await auditFile(f, content));
  }

  const duplicatedWarn = [...sentenceOwners.entries()].filter(([, owners]) => owners.size >= 2 && owners.size < 4);
  const duplicatedCross = [...sentenceOwners.entries()].filter(([, owners]) => owners.size >= 4);

  console.log("════════════════════════════════════════════════════════════════════");
  console.log("  AUDIT UNIFIÉ RANG S+ (amens.store × b2bpro) — 5 PILIERS / 100 PTS");
  console.log("════════════════════════════════════════════════════════════════════");
  for (const r of rows) {
    console.log(
      `[${r.grade.padEnd(2)}] ${String(r.total).padStart(3)}/100 | SEO ${r.seo}/30 GEO ${r.geo}/25 HUM ${r.human}/25 CRO ${r.cro}/10 MOB ${r.mobile}/10 | ${r.file}`
    );
    for (const c of r.criticals) console.log(`    ✗ ${c}`);
    for (const w of r.warnings) console.log(`    ! ${w}`);
  }
  console.log("────────────────────────────────────────────────────────────────────");
  console.log(`Duplication inter-articles (≥ 4 articles) : ${duplicatedCross.length} · (2–3 articles) : ${duplicatedWarn.length}`);
  if (duplicatedCross.length > 0) {
    for (const [sent, owners] of duplicatedCross.slice(0, 5)) {
      console.log(`  [BLOQUANT ${owners.size}× ${[...owners].join(", ")}] ${sent.slice(0, 90)}`);
    }
  }
  if (duplicatedWarn.length > 0) {
    for (const [sent, owners] of duplicatedWarn.slice(0, 5)) {
      console.log(`  [INFO ${owners.size}× ${[...owners].join(", ")}] ${sent.slice(0, 90)}`);
    }
  }
  const failed = rows.some((r) => r.criticals.length > 0) || duplicatedCross.length > 0;
  console.log(`Verdict global : ${failed ? "ÉCHEC" : "CONFORME S+/A"}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
