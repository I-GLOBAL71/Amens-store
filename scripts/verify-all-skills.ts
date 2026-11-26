#!/usr/bin/env bun
/**
 * Gardien principal de pré-publication : vérifie que TOUS les skills
 * (AIO, AEO, GEO, SEO, Humanisation, Traces IA, Vérification contenu,
 * Visuel WebP + Vercel Blob, Invisibilité visiteur GUARDRAILS §7) sont
 * scrupuleusement respectés avant toute publication.
 *
 * Usage :
 *   bun run scripts/verify-all-skills.ts --all [--require-blob] [--json]
 *   bun run scripts/verify-all-skills.ts --slug afrique/orange-money
 *   bun run scripts/verify-all-skills.ts --file draft.md --angle 1 --requete "installer n8n" --title "..." --slug "..."
 *
 * Code de sortie : 0 = tous les skills validés | 1 = bloquant détecté (publication refusée).
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import { extractFaq, runPipeline } from "../src/lib/pipeline/runner";
import type { PipelineInput, PipelineResult } from "../src/lib/pipeline/types";

interface VisualCheck {
  ok: boolean;
  localExists: boolean;
  bytes: number;
  blobUrl?: string;
  issues: string[];
}

interface FullSkillReport {
  slug: string;
  title: string;
  canPublish: boolean;
  overallScore: number;
  pipeline: PipelineResult;
  aeoOk: boolean;
  aeoIssues: string[];
  visual: VisualCheck;
  guardrailIssues: string[];
}

const MANIFEST_PATH = path.join(process.cwd(), "public", "img", "blog", "manifest.json");
const FORBIDDEN_PUBLIC_TERMS = [
  /\bSEO\b/,
  /\bGEO\b/,
  /\bAIO\b/,
  /\bAEO\b/,
  /\bBlue\s+Ocean\b/i,
  /\bKD\s+proxy\b/i,
  /\bllms\.txt\b/i,
  /\bQuery\s+Fan-?Out\b/i,
];

function loadManifest(): Record<string, { localPath: string; blobUrl?: string; bytes: number }> {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function checkVisual(
  slug: string,
  manifest: Record<string, { localPath: string; blobUrl?: string; bytes: number }>,
  requireBlob: boolean
): VisualCheck {
  const flat = `${slug.replaceAll("/", "-")}.webp`;
  const localFile = path.join(process.cwd(), "public", "img", "blog", flat);
  const localExists = existsSync(localFile);
  const bytes = localExists ? statSync(localFile).size : 0;
  const entry = manifest[slug];
  const issues: string[] = [];

  if (!localExists) issues.push(`Visuel WebP absent : public/img/blog/${flat}`);
  else if (bytes > 120 * 1024) issues.push(`Visuel WebP trop lourd (${(bytes / 1024).toFixed(1)} Ko > 120 Ko)`);
  if (!entry) issues.push(`Entrée absente dans public/img/blog/manifest.json pour ${slug}`);
  if (requireBlob && !entry?.blobUrl) issues.push(`blobUrl Vercel Blob absent dans manifest.json pour ${slug}`);

  return {
    ok: issues.length === 0,
    localExists,
    bytes,
    blobUrl: entry?.blobUrl,
    issues,
  };
}

export function checkAeoAndGuardrails(content: string): {
  aeoOk: boolean;
  aeoIssues: string[];
  guardrailIssues: string[];
} {
  const aeoIssues: string[] = [];
  const faq = extractFaq(content);
  if (faq.length < 5) aeoIssues.push(`FAQ AEO insuffisante (${faq.length} Q/R < 5)`);
  if (!faq.some((q) => /^comment\b/i.test(q.question.trim()))) {
    aeoIssues.push("Aucune question FAQ commençant par « Comment… » (requis AEO/GEO)");
  }

  // Vérifier la présence d'une réponse directe sous le H1 (Answer-First)
  const afterH1 = content.replace(/^#[^\n]*\n+/, "").split(/\n##\s+/)[0] ?? "";
  const introWords = afterH1.replace(/[*_`>#-]/g, " ").split(/\s+/).filter(Boolean).length;
  if (introWords < 35) aeoIssues.push(`Bloc Answer-First trop court (${introWords} mots < 35)`);

  // Guardrails §7 : zéro jargon stratégique visible
  const guardrailIssues: string[] = [];
  const proseNoCode = content.replace(/```[\s\S]*?```/g, "");
  for (const pat of FORBIDDEN_PUBLIC_TERMS) {
    const m = proseNoCode.match(pat);
    if (m) guardrailIssues.push(`Fuite terme stratégique interne dans le contenu visible : « ${m[0]} »`);
  }

  return {
    aeoOk: aeoIssues.length === 0,
    aeoIssues,
    guardrailIssues,
  };
}

export async function verifyArticleWithAllSkills(
  input: PipelineInput & { slug: string },
  requireBlob: boolean
): Promise<FullSkillReport> {
  const manifest = loadManifest();
  const pipeline = await runPipeline(input);
  const { aeoOk, aeoIssues, guardrailIssues } = checkAeoAndGuardrails(input.content);
  const visual = checkVisual(input.slug, manifest, requireBlob);

  const canPublish = pipeline.canPublish && aeoOk && visual.ok && guardrailIssues.length === 0;
  return {
    slug: input.slug,
    title: input.title,
    canPublish,
    overallScore: pipeline.overallScore,
    pipeline,
    aeoOk,
    aeoIssues,
    visual,
    guardrailIssues,
  };
}

function argVal(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const requireBlob = args.includes("--require-blob") || Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const asJson = args.includes("--json");
  const fileArg = argVal(args, "--file");
  const slugArg = argVal(args, "--slug");

  const targets: (PipelineInput & { slug: string })[] = [];

  if (fileArg) {
    const p = path.resolve(fileArg);
    if (!existsSync(p)) {
      console.error(`✗ Fichier introuvable : ${p}`);
      process.exit(1);
    }
    const content = readFileSync(p, "utf-8");
    const title = argVal(args, "--title") ?? content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(p, ".md");
    const angle = Number(argVal(args, "--angle") ?? "1");
    const requete = argVal(args, "--requete") ?? title.split(/\s+/).slice(0, 3).join(" ");
    const slug = slugArg ?? path.basename(p, ".md").replace(/-/, "/");
    targets.push({ slug, angle, requete, title, content });
  } else if (slugArg) {
    const a = await db.article.findUnique({ where: { slug: slugArg } });
    if (!a) {
      console.error(`✗ Article introuvable en base : ${slugArg}`);
      process.exit(1);
    }
    targets.push({
      slug: a.slug,
      angle: a.angle,
      requete: a.title.split(/\s+/).slice(0, 4).join(" "),
      title: a.title,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      content: a.content,
    });
  } else {
    const articles = await db.article.findMany({
      where: { status: "published" },
      orderBy: { angle: "asc" },
    });
    for (const a of articles) {
      const kw = await db.keywordResearch.findFirst({
        where: { angle: a.angle, verdict: "CIBLER" },
        select: { requete: true },
      });
      targets.push({
        slug: a.slug,
        angle: a.angle,
        requete: kw?.requete ?? a.title.split(/\s+/).slice(0, 4).join(" "),
        title: a.title,
        metaTitle: a.metaTitle,
        metaDescription: a.metaDescription,
        content: a.content,
      });
    }
  }

  const reports: FullSkillReport[] = [];
  for (const t of targets) {
    reports.push(await verifyArticleWithAllSkills(t, requireBlob));
  }

  if (asJson) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    for (const r of reports) {
      const icon = r.canPublish ? "✓" : "✗";
      const gates = r.pipeline.steps.map((s) => `${s.skillSlug}:${s.status}`).join(" | ");
      console.log(`${icon} ${r.slug} — score=${r.overallScore}/100 | webp=${r.visual.localExists ? (r.visual.bytes / 1024).toFixed(1) + "Ko" : "NON"} | blob=${r.visual.blobUrl ? "oui" : "non"}`);
      console.log(`    Skills : ${gates}`);
      for (const s of r.pipeline.steps) {
        for (const iss of s.issues.filter((i) => i.level === "BLOQUANT")) {
          console.log(`    [BLOQUANT ${s.skillSlug}] ${iss.message}`);
        }
      }
      for (const iss of r.aeoIssues) console.log(`    [AEO] ${iss}`);
      for (const iss of r.visual.issues) console.log(`    [VISUEL] ${iss}`);
      for (const iss of r.guardrailIssues) console.log(`    [GUARDRAIL] ${iss}`);
    }
    const passed = reports.filter((r) => r.canPublish).length;
    console.log(`\nVerdict global (tous skills + visuels + AEO) : ${passed}/${reports.length} prêts à publier.`);
  }

  if (reports.some((r) => !r.canPublish)) process.exit(1);
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
