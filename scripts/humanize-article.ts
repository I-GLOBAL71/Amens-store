#!/usr/bin/env bun
/**
 * Script robuste d'humanisation à 100 % (protocole 6 passes `humanisation-100`).
 *
 * Exécute `analyse_style.py` + contrôles typographiques et d'ancrage terrain :
 *   - 0 marqueur lexical IA
 *   - Variation de longueur de phrases (burstiness >= 0,40, cible >= 0,45)
 *   - 0 début de paragraphe répété >= 3x
 *   - Sobriété sur les tirets cadratins (— <= 2, idéal 0)
 *   - Décimales françaises à la virgule (hors blocs de code / URLs)
 *   - Ancrage concret daté (date + devise € / FCFA / $)
 *
 * Usage :
 *   bun run scripts/humanize-article.ts --all [--check | --fix]
 *   bun run scripts/humanize-article.ts --file content/articles/afrique-orange-money.md [--fix]
 *   bun run scripts/humanize-article.ts --slug afrique/orange-money [--fix]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import { cleanupTmp, runPy, SCRIPTS, writeTmp } from "../src/lib/pipeline/py";

export interface HumanizationReport {
  target: string;
  verdictHumain: boolean;
  aiMarkers: number;
  variation: number;
  triptychs: number;
  impersonal: number;
  emDashes: number;
  repeatedStarts: string | null;
  hasDatedAnchor: boolean;
  passed: boolean;
  fixed: boolean;
  actions: string[];
}

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

/**
 * Applique les corrections typographiques déterministes sans toucher aux blocs
 * de code, URLs ni séparateurs de tableaux Markdown.
 */
export function deterministicHumanize(content: string): string {
  const lines = content.split("\n");
  let inCode = false;
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCode = !inCode;
      return line;
    }
    if (inCode || trimmed.startsWith("|---") || trimmed.startsWith("---")) {
      return line;
    }

    let next = line;
    // Remplacer les cadratins en prose par une virgule ou un deux-points léger
    next = next.replace(/\s+—\s+/g, ", ");
    // Décimales anglaises en prose devant unités FR (hors URLs)
    next = next.replace(/(^|[\s(])(\d+)\.(\d+)(\s*(?:%|€|ms|s\b|Go|Mo|Ko))/g, "$1$2,$3$4");
    return next;
  });
  return out.join("\n");
}

export async function auditHumanization(content: string, label: string): Promise<HumanizationReport> {
  const stamp = `hum-${label.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`;
  const tmpFile = await writeTmp(`${stamp}.md`, content);
  const res = await runPy(SCRIPTS.humanStyle, [tmpFile]);
  await cleanupTmp(stamp);

  const verdictHumain = res.stdout.includes("HUMAIN probable");
  const aiMarkers = Number(res.stdout.match(/Marqueurs IA détectés\s*:\s*(\d+)/)?.[1] ?? "0");
  const variation = Number(res.stdout.match(/variation\s+([\d.]+)/)?.[1] ?? "0");
  const triptychs = Number(res.stdout.match(/Triptymes parallèles\s*:\s*(\d+)/)?.[1] ?? "0");
  const impersonal = Number(res.stdout.match(/Tournures impersonnelles[^:]*:\s*(\d+)/)?.[1] ?? "0");
  const emDashes = (content.match(/—/g) ?? []).length;
  const repeatedStarts = res.stdout.match(/Débuts de paragraphes répétés \(≥3×\) : (.+)/)?.[1]?.trim() ?? null;

  const hasDate = /\b(?:\d{2}\/\d{2}\/\d{4}|(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+202\d)\b/i.test(content);
  const hasCurrency = /\d[\d\s.,]*\s*(?:€|FCFA|\$)/.test(content);
  const hasDatedAnchor = hasDate && hasCurrency;

  const actions: string[] = [];
  if (aiMarkers > 0) actions.push(`Supprimer les ${aiMarkers} marqueur(s) lexical(aux) IA détecté(s)`);
  if (variation < 0.40) actions.push(`Varier la longueur des phrases (variation=${variation.toFixed(2)} < 0,40 ; cible >= 0,45)`);
  else if (variation < 0.45) actions.push(`Optionnel : renforcer le burstiness (variation=${variation.toFixed(2)}, cible >= 0,45)`);
  if (repeatedStarts) actions.push(`Varier les débuts de paragraphes répétés : ${repeatedStarts}`);
  if (emDashes > 2) actions.push(`Réduire les ${emDashes} tirets cadratins (—) à <= 2 (utiliser --fix)`);
  if (!hasDatedAnchor) actions.push("Ancrer au moins une donnée datée (ex: 26/11/2026) et un tarif local (€ / FCFA)");

  const passed = verdictHumain && aiMarkers === 0 && emDashes <= 2;
  return {
    target: label,
    verdictHumain,
    aiMarkers,
    variation,
    triptychs,
    impersonal,
    emDashes,
    repeatedStarts,
    hasDatedAnchor,
    passed,
    fixed: false,
    actions,
  };
}

async function processTarget(content: string, label: string, fix: boolean): Promise<{ nextContent: string; report: HumanizationReport }> {
  let nextContent = content;
  let fixed = false;
  if (fix) {
    const transformed = deterministicHumanize(content);
    if (transformed !== content) {
      nextContent = transformed;
      fixed = true;
    }
  }
  const report = await auditHumanization(nextContent, label);
  report.fixed = fixed;
  return { nextContent, report };
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix");
  const all = args.includes("--all");
  const fileIdx = args.indexOf("--file");
  const slugIdx = args.indexOf("--slug");

  const reports: HumanizationReport[] = [];

  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = path.resolve(args[fileIdx + 1]);
    if (!existsSync(filePath)) {
      console.error(`✗ Fichier introuvable : ${filePath}`);
      process.exit(1);
    }
    const raw = readFileSync(filePath, "utf-8");
    const { nextContent, report } = await processTarget(raw, path.basename(filePath), fix);
    if (fix && nextContent !== raw) writeFileSync(filePath, nextContent, "utf-8");
    reports.push(report);
  } else if (slugIdx !== -1 && args[slugIdx + 1]) {
    const slug = args[slugIdx + 1];
    const art = await db.article.findUnique({ where: { slug }, select: { id: true, slug: true, content: true } });
    if (!art) {
      console.error(`✗ Article DB introuvable pour slug : ${slug}`);
      process.exit(1);
    }
    const { nextContent, report } = await processTarget(art.content, `db:${art.slug}`, fix);
    if (fix && nextContent !== art.content) {
      await db.article.update({ where: { id: art.id }, data: { content: nextContent } });
    }
    reports.push(report);
  } else if (all || args.length === 0) {
    if (existsSync(ARTICLES_DIR)) {
      for (const f of readdirSync(ARTICLES_DIR).filter((x) => x.endsWith(".md")).sort()) {
        const p = path.join(ARTICLES_DIR, f);
        const raw = readFileSync(p, "utf-8");
        const { nextContent, report } = await processTarget(raw, `file:${f}`, fix);
        if (fix && nextContent !== raw) writeFileSync(p, nextContent, "utf-8");
        reports.push(report);
      }
    }
    const dbArticles = await db.article.findMany({ select: { id: true, slug: true, content: true } });
    for (const art of dbArticles) {
      const { nextContent, report } = await processTarget(art.content, `db:${art.slug}`, fix);
      if (fix && nextContent !== art.content) {
        await db.article.update({ where: { id: art.id }, data: { content: nextContent } });
      }
      reports.push(report);
    }
  }

  let failed = 0;
  for (const r of reports) {
    if (!r.passed) failed++;
    const icon = r.passed ? "✓" : "✗";
    const tag = r.fixed ? " [CORRIGÉ]" : "";
    console.log(
      `${icon} ${r.target}${tag} — verdict=${r.verdictHumain ? "HUMAIN" : "IA"} | marqueurs=${r.aiMarkers} | variation=${r.variation.toFixed(2)} | em-dash=${r.emDashes} | ancrage=${r.hasDatedAnchor ? "oui" : "non"}`
    );
    for (const a of r.actions) console.log(`    → ${a}`);
  }

  console.log(`\nRésumé humanisation 100 % : ${reports.length - failed}/${reports.length} validés.`);
  if (failed > 0) process.exit(1);
}

if (import.meta.main) {
  main()
    .catch((err) => {
      console.error("Erreur :", err);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
