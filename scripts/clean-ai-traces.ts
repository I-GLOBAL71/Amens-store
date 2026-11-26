#!/usr/bin/env bun
/**
 * Script robuste de vérification et de nettoyage de toute trace technique IA.
 *
 * Exécute les scripts officiels du skill `suppression-traces-ia` :
 *   - nettoyer_unicode.py (zero-width, bidi overrides, tags Unicode, espaces exotiques, homoglyphes)
 *   - nettoyer_metadonnees.py (artefacts LLM : oaicite, utm_source=chatgpt.com, commentaires générateur)
 * + hygiène déterministe complémentaire (espaces de fin de ligne, CRLF, doubles sauts excessifs).
 *
 * Usage :
 *   bun run scripts/clean-ai-traces.ts --all [--check | --fix]
 *   bun run scripts/clean-ai-traces.ts --file content/articles/afrique-orange-money.md [--fix]
 *   bun run scripts/clean-ai-traces.ts --slug afrique/orange-money [--fix]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import { cleanupTmp, readTmp, runPy, SCRIPTS, writeTmp } from "../src/lib/pipeline/py";

export interface TraceReport {
  target: string;
  unicodeSuspects: number;
  metadataHits: number;
  trailingSpaces: number;
  crlfCount: number;
  clean: boolean;
  fixed: boolean;
  details: string[];
}

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export async function inspectTraces(content: string, label: string): Promise<TraceReport> {
  const stamp = `trace-${label.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`;
  const tmpFile = await writeTmp(`${stamp}.md`, content);

  const uniRes = await runPy(SCRIPTS.tracesUnicode, [tmpFile, "--inspecter"]);
  const metaRes = await runPy(SCRIPTS.tracesMeta, [tmpFile, "--inspecter"]);
  await cleanupTmp(stamp);

  const unicodeClean = uniRes.stdout.includes("aucun caractère suspect détecté");
  const unicodeMatch = uniRes.stdout.match(/===\s*(\d+)\s*caractère\(s\) suspect\(s\)/);
  const unicodeSuspects = unicodeClean ? 0 : unicodeMatch ? Number(unicodeMatch[1]) : 1;

  const metaMatch = metaRes.stdout.match(/Métadonnées IA détectées\s*:\s*(\d+)/);
  const metadataHits = metaMatch ? Number(metaMatch[1]) : 0;

  const trailingSpaces = (content.match(/[ \t]+$/gm) ?? []).length;
  const crlfCount = (content.match(/\r\n/g) ?? []).length;

  const details: string[] = [];
  if (unicodeSuspects > 0) details.push(`${unicodeSuspects} caractère(s) Unicode suspect(s) (zero-width/bidi/homoglyphe)`);
  if (metadataHits > 0) details.push(`${metadataHits} artefact(s) de métadonnées IA`);
  if (trailingSpaces > 0) details.push(`${trailingSpaces} ligne(s) avec espaces de fin`);
  if (crlfCount > 0) details.push(`${crlfCount} fin(s) de ligne CRLF`);

  return {
    target: label,
    unicodeSuspects,
    metadataHits,
    trailingSpaces,
    crlfCount,
    clean: unicodeSuspects === 0 && metadataHits === 0,
    fixed: false,
    details,
  };
}

export async function cleanTraces(content: string, label: string): Promise<{ cleaned: string; report: TraceReport }> {
  const stamp = `clean-${label.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`;
  const tmpFile = await writeTmp(`${stamp}.md`, content);

  await runPy(SCRIPTS.tracesUnicode, [tmpFile]);
  const afterUnicode = (await readTmp(`${stamp}.md.clean`)) ?? content;

  const tmpFile2 = await writeTmp(`${stamp}-2.md`, afterUnicode);
  await runPy(SCRIPTS.tracesMeta, [tmpFile2]);
  let cleaned = (await readTmp(`${stamp}-2.md.clean`)) ?? afterUnicode;

  await cleanupTmp(stamp);

  // Hygiène déterministe complémentaire (sans altérer les tableaux ni blocs de code)
  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{4,}/g, "\n\n\n");

  const report = await inspectTraces(cleaned, `${label}-after`);
  report.target = label;
  report.fixed = cleaned !== content;
  return { cleaned, report };
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix");
  const all = args.includes("--all");
  const fileIdx = args.indexOf("--file");
  const slugIdx = args.indexOf("--slug");

  const reports: TraceReport[] = [];

  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = path.resolve(args[fileIdx + 1]);
    if (!existsSync(filePath)) {
      console.error(`✗ Fichier introuvable : ${filePath}`);
      process.exit(1);
    }
    const raw = readFileSync(filePath, "utf-8");
    if (fix) {
      const { cleaned, report } = await cleanTraces(raw, path.basename(filePath));
      if (cleaned !== raw) writeFileSync(filePath, cleaned, "utf-8");
      reports.push(report);
    } else {
      reports.push(await inspectTraces(raw, path.basename(filePath)));
    }
  } else if (slugIdx !== -1 && args[slugIdx + 1]) {
    const slug = args[slugIdx + 1];
    const art = await db.article.findUnique({ where: { slug }, select: { id: true, slug: true, content: true } });
    if (!art) {
      console.error(`✗ Article DB introuvable pour slug : ${slug}`);
      process.exit(1);
    }
    if (fix) {
      const { cleaned, report } = await cleanTraces(art.content, `db:${art.slug}`);
      if (cleaned !== art.content) {
        await db.article.update({ where: { id: art.id }, data: { content: cleaned } });
      }
      reports.push(report);
    } else {
      reports.push(await inspectTraces(art.content, `db:${art.slug}`));
    }
  } else if (all || args.length === 0) {
    if (existsSync(ARTICLES_DIR)) {
      const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md")).sort();
      for (const f of files) {
        const p = path.join(ARTICLES_DIR, f);
        const raw = readFileSync(p, "utf-8");
        if (fix) {
          const { cleaned, report } = await cleanTraces(raw, `file:${f}`);
          if (cleaned !== raw) writeFileSync(p, cleaned, "utf-8");
          reports.push(report);
        } else {
          reports.push(await inspectTraces(raw, `file:${f}`));
        }
      }
    }
    const dbArticles = await db.article.findMany({ select: { id: true, slug: true, content: true } });
    for (const art of dbArticles) {
      if (fix) {
        const { cleaned, report } = await cleanTraces(art.content, `db:${art.slug}`);
        if (cleaned !== art.content) {
          await db.article.update({ where: { id: art.id }, data: { content: cleaned } });
        }
        reports.push(report);
      } else {
        reports.push(await inspectTraces(art.content, `db:${art.slug}`));
      }
    }
  }

  let dirty = 0;
  for (const r of reports) {
    if (!r.clean) dirty++;
    const icon = r.clean ? "✓" : "✗";
    const suffix = r.fixed ? " [NETTOYÉ]" : "";
    console.log(`${icon} ${r.target}${suffix} — unicode=${r.unicodeSuspects}, meta=${r.metadataHits}, trailing=${r.trailingSpaces}`);
    for (const d of r.details) console.log(`    · ${d}`);
  }

  console.log(`\nRésumé traces IA : ${reports.length - dirty}/${reports.length} propres.`);
  if (dirty > 0) process.exit(1);
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
