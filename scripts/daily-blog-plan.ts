#!/usr/bin/env bun
/**
 * Planificateur & orchestrateur quotidien de 3 articles de blog (Amens.store).
 *
 * Gardien principal : TOUS les skills (blueocean-keywords, pipeline-amens,
 * seo-ultra, geo-citations-ia, humanisation-100, suppression-traces-ia,
 * verification-contenu) + visuel WebP léger hébergé sur Vercel Blob.
 *
 * Usage :
 *   bun run scripts/daily-blog-plan.ts [--date YYYY-MM-DD] [--status]
 *   bun run scripts/daily-blog-plan.ts [--date YYYY-MM-DD] --init-skeletons
 *   bun run scripts/daily-blog-plan.ts [--date YYYY-MM-DD] --publish-ready
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import { angleById } from "../src/lib/pipeline/types";
import { runPy, SCRIPTS } from "../src/lib/pipeline/py";
import { computeSlug, extractFaq, runPipeline } from "../src/lib/pipeline/runner";
import { excerptFrom } from "../src/lib/serialize";
import { cleanTraces } from "./clean-ai-traces";
import { auditHumanization, deterministicHumanize } from "./humanize-article";
import { checkAeoAndGuardrails } from "./verify-all-skills";

export interface DailySlot {
  slot: 1 | 2 | 3;
  creneau: "08:30 (Matin)" | "13:00 (Midi)" | "18:30 (Soir)";
  angle: number;
  silo: string;
  requete: string;
  title: string;
  slug: string;
  draftPath: string;
  status: "planned" | "drafted" | "blocked" | "published";
}

export interface DailyPlanFile {
  date: string;
  slots: DailySlot[];
}

const PLAN_PATH = path.join(process.cwd(), "config", "daily-blog-plan.json");

const DEFAULT_SEEDS_BY_ANGLE: Record<number, { requete: string; title: string }[]> = {
  1: [
    { requete: "auto-héberger flowise vps", title: "Auto-héberger Flowise sur un VPS en 15 minutes (testé en 2026)" },
    { requete: "installer ollama sur vps", title: "Installer Ollama sur un VPS : coût réel, RAM et latence mesurée" },
  ],
  2: [
    { requete: "déployer app bolt sur domaine", title: "Déployer une app Bolt.new sur ton propre nom de domaine (guide 2026)" },
    { requete: "héberger app nextjs sans vercel", title: "Héberger une app Next.js sur VPS avec Coolify : test complet" },
  ],
  3: [
    { requete: "payer hébergement mtn momo", title: "Payer son hébergement web avec MTN MoMo au Cameroun (guide 2026)" },
    { requete: "nom de domaine wave sénégal", title: "Acheter un nom de domaine avec Wave au Sénégal sans carte bancaire" },
  ],
  4: [
    { requete: "comparatif vps moins cher 2026", title: "Comparatif VPS pas cher 2026 : vrai coût sur 3 ans et latence Labo" },
  ],
  5: [
    { requete: "migrer wordpress sans coupure", title: "Migrer un site WordPress sans coupure DNS ni perte de données" },
  ],
  6: [
    { requete: "code promo hostinger 2026", title: "Code promo Hostinger 2026 : vraies remises et prix au renouvellement" },
  ],
  7: [
    { requete: "configurer spf dkim dmarc", title: "Configurer SPF, DKIM et DMARC sur ton domaine en 10 minutes" },
  ],
  8: [
    { requete: "vérifier panne serveur site", title: "Site inaccessible : vérifier si la panne vient de ton hébergeur" },
  ],
  9: [
    { requete: "site web clinique médicale", title: "Créer le site web d'une clinique médicale : prix, RDV et email pro" },
  ],
  10: [
    { requete: "hébergement multi-clients agence", title: "Hébergement multi-clients pour agence web : marge nette et outils" },
  ],
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugifySimple(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 55);
}

function loadAllPlans(): Record<string, DailyPlanFile> {
  if (!existsSync(PLAN_PATH)) return {};
  try {
    return JSON.parse(readFileSync(PLAN_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveAllPlans(plans: Record<string, DailyPlanFile>) {
  mkdirSync(path.dirname(PLAN_PATH), { recursive: true });
  writeFileSync(PLAN_PATH, JSON.stringify(plans, null, 2) + "\n", "utf-8");
}

async function generatePlanForDate(date: string): Promise<DailyPlanFile> {
  const existingArticles = await db.article.findMany({ select: { slug: true, title: true } });
  const existingSlugs = new Set(existingArticles.map((a) => a.slug));

  const daySeed = Number(date.replace(/-/g, "")) % 10;
  const creneaux: DailySlot["creneau"][] = ["08:30 (Matin)", "13:00 (Midi)", "18:30 (Soir)"];
  const slots: DailySlot[] = [];

  for (let i = 0; i < 3; i++) {
    const angleId = ((daySeed + i * 3) % 10) + 1;
    const angleDef = angleById(angleId)!;

    // Chercher une requête CIBLER non utilisée dans KeywordResearch, sinon fallback seed
    const dbKws = await db.keywordResearch.findMany({
      where: { angle: angleId, verdict: "CIBLER" },
      orderBy: { difficulte: "asc" },
    });

    let requete = "";
    let title = "";
    for (const kw of dbKws) {
      const candidateSlug = `${angleDef.silo}/${slugifySimple(kw.requete)}`;
      if (!existingSlugs.has(candidateSlug)) {
        requete = kw.requete;
        title = `${kw.requete.charAt(0).toUpperCase() + kw.requete.slice(1)} : guide complet et testé (2026)`;
        break;
      }
    }

    if (!requete) {
      const seeds = DEFAULT_SEEDS_BY_ANGLE[angleId] ?? DEFAULT_SEEDS_BY_ANGLE[1];
      const pick = seeds.find((s) => !existingSlugs.has(`${angleDef.silo}/${slugifySimple(s.requete)}`)) ?? seeds[0];
      requete = pick.requete;
      title = pick.title;
    }

    const slug = `${angleDef.silo}/${slugifySimple(requete)}`;
    existingSlugs.add(slug);
    const draftPath = path.join("content", "drafts", date, `${slug.replaceAll("/", "-")}.md`);

    slots.push({
      slot: (i + 1) as 1 | 2 | 3,
      creneau: creneaux[i],
      angle: angleId,
      silo: angleDef.silo,
      requete,
      title,
      slug,
      draftPath,
      status: existsSync(draftPath) ? "drafted" : "planned",
    });
  }

  return { date, slots };
}

async function initSkeletons(plan: DailyPlanFile) {
  const dir = path.join(process.cwd(), "content", "drafts", plan.date);
  mkdirSync(dir, { recursive: true });

  for (const s of plan.slots) {
    const absDraft = path.resolve(s.draftPath);
    if (existsSync(absDraft)) {
      console.log(`· Slot ${s.slot} (${s.slug}) : brouillon déjà présent -> ${s.draftPath}`);
      s.status = "drafted";
      continue;
    }
    const res = await runPy(SCRIPTS.squelette, [
      "--angle",
      String(s.angle),
      "--requete",
      s.requete,
      "--titre",
      s.title,
      "--sortie",
      absDraft,
    ]);
    if (res.code === 0 && existsSync(absDraft)) {
      console.log(`✓ Slot ${s.slot} (${s.creneau}) : squelette généré -> ${s.draftPath}`);
      s.status = "drafted";
    } else {
      console.error(`✗ Slot ${s.slot} : échec génération squelette (${res.stderr})`);
    }
  }
}

async function publishReady(plan: DailyPlanFile) {
  let blockedCount = 0;

  for (const s of plan.slots) {
    const absDraft = path.resolve(s.draftPath);
    if (!existsSync(absDraft)) {
      console.error(`✗ Slot ${s.slot} (${s.slug}) : brouillon absent (${s.draftPath}). Lance d'abord --init-skeletons et rédige le contenu.`);
      s.status = "blocked";
      blockedCount++;
      continue;
    }

    const raw = readFileSync(absDraft, "utf-8");

    // 1. Nettoyage déterministe des traces IA
    const { cleaned: traceFree } = await cleanTraces(raw, s.slug);

    // 2. Humanisation déterministe + audit 100 %
    const humanized = deterministicHumanize(traceFree);
    if (humanized !== raw) writeFileSync(absDraft, humanized, "utf-8");

    const humReport = await auditHumanization(humanized, s.slug);
    if (!humReport.passed) {
      console.error(`✗ Slot ${s.slot} (${s.slug}) bloqué par humanisation-100 :`);
      humReport.actions.forEach((a) => console.error(`    → ${a}`));
      s.status = "blocked";
      blockedCount++;
      continue;
    }

    // 3. Exécution complète des 7 skills du pipeline
    const title = humanized.match(/^#\s+(.+)$/m)?.[1]?.trim() || s.title;
    const slug = computeSlug({ angle: s.angle, requete: s.requete, title, content: humanized, slug: s.slug });
    const pipeline = await runPipeline({
      angle: s.angle,
      requete: s.requete,
      title,
      slug,
      content: humanized,
    });
    const aeoGuard = checkAeoAndGuardrails(humanized);

    if (!pipeline.canPublish || !aeoGuard.aeoOk || aeoGuard.guardrailIssues.length > 0) {
      console.error(`✗ Slot ${s.slot} (${slug}) REFUSÉ par le gardien des skills :`);
      for (const st of pipeline.steps) {
        for (const iss of st.issues.filter((i) => i.level === "BLOQUANT")) {
          console.error(`    [BLOQUANT ${st.skillSlug}] ${iss.message}`);
        }
      }
      aeoGuard.aeoIssues.forEach((i) => console.error(`    [AEO] ${i}`));
      aeoGuard.guardrailIssues.forEach((i) => console.error(`    [GUARDRAIL] ${i}`));
      s.status = "blocked";
      blockedCount++;
      continue;
    }

    // 4. Enregistrement DB (statut published uniquement après 100 % de gates vertes)
    const seoStep = pipeline.steps.find((st) => st.skillSlug === "seo-ultra");
    const geoStep = pipeline.steps.find((st) => st.skillSlug === "geo-citations-ia");
    const humStep = pipeline.steps.find((st) => st.skillSlug === "humanisation-100");
    const faq = extractFaq(humanized);
    const angleDef = angleById(s.angle);

    await db.article.upsert({
      where: { slug },
      update: {
        title,
        metaTitle: title.slice(0, 60),
        metaDescription: excerptFrom(humanized, 155),
        excerpt: excerptFrom(humanized, 220),
        content: pipeline.cleanedContent,
        faqJson: JSON.stringify(faq),
        seoScore: seoStep?.score ?? 100,
        geoScore: geoStep?.score ?? 85,
        humanScore: humStep?.score ?? 100,
        verificationPassed: true,
        status: "published",
        publishedAt: new Date(),
      },
      create: {
        slug,
        silo: angleDef?.silo ?? s.silo,
        angle: s.angle,
        title,
        metaTitle: title.slice(0, 60),
        metaDescription: excerptFrom(humanized, 155),
        excerpt: excerptFrom(humanized, 220),
        content: pipeline.cleanedContent,
        faqJson: JSON.stringify(faq),
        seoScore: seoStep?.score ?? 100,
        geoScore: geoStep?.score ?? 85,
        humanScore: humStep?.score ?? 100,
        verificationPassed: true,
        status: "published",
        publishedAt: new Date(),
      },
    });

    // 5. Génération du visuel WebP léger + upload Vercel Blob
    execFileSync("bun", ["run", "scripts/gen-article-visuals.ts", "--slug", slug], {
      stdio: "inherit",
    });

    s.status = "published";
    console.log(`✓ Slot ${s.slot} (${slug}) PUBLIÉ avec visuel WebP/Blob et 7/7 skills validés (${pipeline.overallScore}/100).`);
  }

  if (blockedCount > 0) process.exitCode = 1;
}

async function main() {
  const args = process.argv.slice(2);
  const dateIdx = args.indexOf("--date");
  const date = dateIdx !== -1 && args[dateIdx + 1] ? args[dateIdx + 1] : todayIso();
  const doInit = args.includes("--init-skeletons");
  const doPublish = args.includes("--publish-ready");

  const allPlans = loadAllPlans();
  let plan = allPlans[date];
  if (!plan) {
    plan = await generatePlanForDate(date);
    allPlans[date] = plan;
    saveAllPlans(allPlans);
  }

  if (doInit) {
    await initSkeletons(plan);
    allPlans[date] = plan;
    saveAllPlans(allPlans);
  } else if (doPublish) {
    await publishReady(plan);
    allPlans[date] = plan;
    saveAllPlans(allPlans);
  } else {
    console.log(`📅 Plan éditorial quotidien — ${plan.date} (3 articles / jour)\n`);
    for (const s of plan.slots) {
      console.log(
        `  [${s.slot}/3] ${s.creneau} | Angle ${s.angle} (/${s.silo}/) | Requête: "${s.requete}"`
      );
      console.log(`        Titre   : ${s.title}`);
      console.log(`        Brouillon: ${s.draftPath} [${s.status}]`);
    }
    console.log(`\nCommandes :`);
    console.log(`  1. Générer les 3 squelettes : bun run scripts/daily-blog-plan.ts --date ${plan.date} --init-skeletons`);
    console.log(`  2. Nettoyer + Humaniser     : bun run articles:clean-traces -- --file <draft.md> --fix && bun run articles:humanize -- --file <draft.md> --fix`);
    console.log(`  3. Publier avec tous skills : bun run scripts/daily-blog-plan.ts --date ${plan.date} --publish-ready`);
  }
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
