// Runner du pipeline éditorial amens.store.
// Orchestre les 7 skills enregistrés dans le projet (dossier /skills) dans
// l'ordre imposé par pipeline-amens :
//   1. blueocean-keywords   → valider la requête (verdict CIBLER)
//   2. pipeline-amens       → gabarit §4.2 + disclosure + maillage + affiliation
//   3. seo-ultra            → audit on-page (audit_meta.py)
//   4. geo-citations-ia     → score de citabilité (score_citabilite.py)
//   5. humanisation-100     → marqueurs de style IA (analyse_style.py)
//   6. suppression-traces-ia→ Unicode invisible + homoglyphes (nettoyer_unicode.py)
//   7. verification-contenu→ GATE FINALE (check_contenu.py, 0 BLOQUANT)
// Publication refusée si une seule gate échoue — jamais de contenu non validé.

import { promises as fs } from "fs";
import path from "path";
import { runPy, SCRIPTS, writeTmp, readTmp, TMP_DIR, cleanupTmp } from "./py";
import { validerRequete } from "./keywords";
import { checkGabarit, extractFaq } from "./gabarit";
import { mdToHtml, wrapHtml } from "./md-html";
import { angleById, DISCLOSURE } from "./types";
import { SITE_URL } from "@/lib/site";
import type {
  PipelineInput,
  PipelineResult,
  PipelineStepResult,
  StepIssue,
} from "./types";

const t0 = () => Date.now();

function slugify(titre: string): string {
  return titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function computeSlug(input: PipelineInput): string {
  if (input.slug) return input.slug;
  const angle = angleById(input.angle);
  const silo = angle ? angle.silo : "blog";
  return `${silo}/${slugify(input.title)}`;
}

/* ── Skill 1 : blueocean-keywords ─────────────────────────────────────────── */
async function stepBlueOcean(input: PipelineInput): Promise<PipelineStepResult> {
  const start = t0();
  const issues: StepIssue[] = [];
  const details: string[] = [];
  let status: PipelineStepResult["status"] = "passed";
  let score = 100;

  const row = await validerRequete(input.requete, input.angle);
  if (!row) {
    return {
      skillSlug: "blueocean-keywords",
      skillName: "Blue Ocean Keywords",
      ordre: 1,
      gate: true,
      status: "error",
      summary: "Scoring indisponible (script prioriser.py injoignable)",
      issues: [{ level: "BLOQUANT", message: "Skill blueocean-keywords n'a pas pu noter la requête — corriger avant publication" }],
      durationMs: t0() - start,
    };
  }
  details.push(
    `Requête « ${row.requete} » · difficulté estimée ${row.scoreDifficulte}/100 · résistance AI Overviews : ${row.resistanceAio} · potentiel affiliation : ${row.potentiel}`
  );
  if (row.verdict === "CIBLER") {
    details.push("Verdict : CIBLER ✓ (≥ 2 conditions du filtre cahier des charges)");
  } else if (row.verdict === "SURVEILLER") {
    score = 55;
    status = "warned";
    issues.push({
      level: "AVERTISSEMENT",
      message: `Verdict SURVEILLER : la requête ne remplit qu'1 condition sur 3 (difficulté < 30, résistance AI Overviews, potentiel affil.) — envisager une variation plus précise`,
    });
  } else {
    score = 15;
    status = "blocked";
    issues.push({
      level: "BLOQUANT",
      message: `Verdict IGNORER : 0 condition sur 3 remplie — changer de requête cible (angle ${input.angle})`,
    });
  }
  return {
    skillSlug: "blueocean-keywords",
    skillName: "Blue Ocean Keywords",
    ordre: 1,
    gate: true,
    status,
    score,
    summary: `Verdict requête : ${row.verdict} (KD proxy ${row.scoreDifficulte})`,
    issues,
    details,
    durationMs: t0() - start,
  };
}

/* ── Skill 2 : pipeline-amens (gabarit §4.2 + règles non négociables) ─────── */
async function stepGabarit(input: PipelineInput): Promise<PipelineStepResult> {
  const start = t0();
  const g = checkGabarit(input.content, input.angle);
  const issues: StepIssue[] = g.issues.map((i) => ({ ...i }));
  return {
    skillSlug: "pipeline-amens",
    skillName: "Pipeline amens (gabarit §4.2)",
    ordre: 2,
    gate: true,
    status: g.passed
      ? issues.length
        ? "warned"
        : "passed"
      : "blocked",
    score: Math.max(0, 100 - issues.filter((i) => i.level === "BLOQUANT").length * 25),
    summary: `Gabarit §4.2 : ${g.wordCount} mots · ${issues.filter((i) => i.level === "BLOQUANT").length} bloquant(s)`,
    issues,
    details: g.details,
    durationMs: t0() - start,
  };
}

/* ── Skill 3 : seo-ultra (audit on-page via audit_meta.py) ────────────────── */
async function stepSeo(
  input: PipelineInput,
  slug: string
): Promise<{ step: PipelineStepResult; jsonLd: string }> {
  const start = t0();
  const issues: StepIssue[] = [];
  const details: string[] = [];
  const faq = extractFaq(input.content);
  const angleDef = angleById(input.angle);
  const metaTitle = input.metaTitle || input.title;
  const metaDescription =
    input.metaDescription ||
    `${input.title} : guide testé, prix réels et commandes copiables. Mis à jour ${new Date().toLocaleDateString("fr-FR")}.`;

  const articleUrl = `${SITE_URL}/?v=article&slug=${encodeURIComponent(slug)}`;
  const todayIso = new Date().toISOString().slice(0, 10);
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: input.title,
        description: metaDescription,
        inLanguage: "fr-FR",
        isAccessibleForFree: true,
        url: articleUrl,
        author: { "@type": "Organization", name: "Équipe amens.store", url: SITE_URL },
        publisher: { "@type": "Organization", name: "amens.store", url: SITE_URL },
        datePublished: todayIso,
        dateModified: todayIso,
        mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
        significantLink: [`${SITE_URL}/?v=labo`, articleUrl],
        ...(angleDef ? { about: angleDef.nom, articleSection: angleDef.nom } : {}),
      },
      ...(faq.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faq.slice(0, 8).map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/?v=blog` },
          { "@type": "ListItem", position: 3, name: input.title },
        ],
      },
    ],
  });

  const bodyHtml = mdToHtml(input.content);
  const html = wrapHtml({
    title: metaTitle,
    metaDescription,
    h1: input.title,
    bodyHtml,
    jsonLd,
  });

  const stamp = `seo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const htmlFile = await writeTmp(`${stamp}.html`, html);
  const jsonOut = path.join(TMP_DIR, `${stamp}-audit.json`);
  const res = await runPy(SCRIPTS.seoAudit, [htmlFile, "--motcle", input.requete, "--json", jsonOut]);

  let bloquants = 0;
  let avertissements = 0;
  let ok = false;
  const report = await readTmp(`${stamp}-audit.json`);
  if (report) {
    try {
      const parsed = JSON.parse(report) as {
        ok: boolean;
        nb_mots: number;
        nb_hn: number;
        tableaux: number;
        liens_internes: number;
        liens_externes: number;
        liens_sponsored: number;
        schemas_jsonld: string[];
        problemes: { niveau: string; message: string }[];
      }[];
      for (const r of parsed) {
        ok = ok || r.ok;
        for (const p of r.problemes) {
          issues.push({
            level: p.niveau as StepIssue["level"],
            message: p.message,
          });
          if (p.niveau === "BLOQUANT") bloquants++;
          else avertissements++;
        }
        details.push(
          `${r.nb_mots} mots · ${r.nb_hn} titres Hn · ${r.tableaux} tableaux · ${r.liens_internes} liens internes · ${r.liens_externes} liens externes · ${r.liens_sponsored} liens sponsored · schemas : ${(r.schemas_jsonld || []).join(", ") || "aucun"}`
        );
      }
    } catch {
      issues.push({ level: "AVERTISSEMENT", message: "Rapport d'audit illisible — sortie console utilisée" });
    }
  }
  if (res.code === 2 || (res.code !== 0 && !report)) {
    return {
      step: {
        skillSlug: "seo-ultra",
        skillName: "SEO Ultra",
        ordre: 3,
        gate: true,
        status: "error",
        summary: "audit_meta.py n'a pas produit de rapport",
        issues: [{ level: "BLOQUANT", message: res.stderr || "Erreur d'exécution du script seo-ultra" }],
        durationMs: t0() - start,
      },
      jsonLd,
    };
  }
  await cleanupTmp(stamp);
  const score = Math.max(0, 100 - bloquants * 40 - avertissements * 8);
  return {
    step: {
      skillSlug: "seo-ultra",
      skillName: "SEO Ultra",
      ordre: 3,
      gate: true,
      status: bloquants > 0 ? "blocked" : avertissements > 0 ? "warned" : "passed",
      score,
      summary: `Audit on-page : ${bloquants} bloquant(s), ${avertissements} avertissement(s)`,
      issues,
      details,
      durationMs: t0() - start,
    },
    jsonLd,
  };
}

/* ── Skill 4 : geo-citations-ia (score_citabilite.py) ──────────────────────── */
async function stepGeo(input: PipelineInput): Promise<PipelineStepResult> {
  const start = t0();
  const stamp = `geo-${Date.now()}`;
  const file = await writeTmp(`${stamp}.md`, input.content);
  const res = await runPy(SCRIPTS.geoScore, [file]);
  await cleanupTmp(stamp);
  const m = res.stdout.match(/Score de citabilité\s*:\s*(\d+)\/100/);
  const score = m ? Number(m[1]) : 0;
  const details = res.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("✓") || l.startsWith("~") || l.startsWith("✗") || l.includes("mots,"));
  const issues: StepIssue[] = [];
  let status: PipelineStepResult["status"] = "passed";
  if (!m) {
    return {
      skillSlug: "geo-citations-ia",
      skillName: "GEO Citations IA",
      ordre: 4,
      gate: true,
      status: "error",
      summary: "score_citabilite.py n'a pas produit de score",
      issues: [{ level: "BLOQUANT", message: res.stderr || "Erreur d'exécution du skill geo-citations-ia" }],
      durationMs: t0() - start,
    };
  }
  if (score < 40) {
    status = "blocked";
    issues.push({
      level: "BLOQUANT",
      message: `Score de citabilité ${score}/100 (< 40) : retravailler la structure — conclusion en tête, blocs citables de 134-167 mots, chiffres datés`,
    });
  } else if (score < 60) {
    status = "warned";
    issues.push({
      level: "AVERTISSEMENT",
      message: `Score de citabilité ${score}/100 (cible ≥ 60) : ajouter des blocs auto-suffisants datés et sourcés`,
    });
  }
  return {
    skillSlug: "geo-citations-ia",
    skillName: "GEO Citations IA",
    ordre: 4,
    gate: true,
    status,
    score,
    summary: `Score de citabilité : ${score}/100 (cible ≥ 60, bloquant < 40)`,
    issues,
    details,
    durationMs: t0() - start,
  };
}

/* ── Skill 5 : humanisation-100 (analyse_style.py) ────────────────────────── */
async function stepHumanisation(input: PipelineInput): Promise<PipelineStepResult> {
  const start = t0();
  const stamp = `hum-${Date.now()}`;
  const file = await writeTmp(`${stamp}.md`, input.content);
  const res = await runPy(SCRIPTS.humanStyle, [file]);
  await cleanupTmp(stamp);
  const issues: StepIssue[] = [];
  const details: string[] = [];

  const markerMatches = [...res.stdout.matchAll(/×(\d+)\s+«\s*([^»]+)\s*»/g)];
  const nbMarqueurs = markerMatches.reduce((acc, m) => acc + Number(m[1]), 0);
  const verdictHumain = res.stdout.includes("HUMAIN probable");
  const variation = res.stdout.match(/variation\s+([\d.]+)/);
  const triptymes = res.stdout.match(/Triptymes parallèles\s*:\s*(\d+)/);
  const debutsRep = res.stdout.includes("Débuts de paragraphes répétés");

  for (const m of markerMatches) {
    issues.push({
      level: "BLOQUANT",
      message: `Marqueur IA « ${m[2].trim()} » présent ×${m[1]} — passe 1 du skill humanisation-100 : supprimer sans pitié`,
    });
  }
  if (debutsRep) {
    issues.push({
      level: "AVERTISSEMENT",
      message: "Débuts de paragraphes répétés ≥ 3× — varier les entrées de paragraphes (passe 2)",
    });
  }
  if (variation && Number(variation[1]) < 0.45) {
    issues.push({
      level: "AVERTISSEMENT",
      message: `Variation des longueurs de phrases ${variation[1]} (< 0,45) — alterner phrases courtes et longues (passe 2)`,
    });
  }
  details.push(
    `Verdict du script : ${verdictHumain ? "HUMAIN probable" : "style IA détectable"} · variation ${variation ? variation[1] : "?"} · triptymes ${triptymes ? triptymes[1] : "?"}`
  );

  const score = Math.max(
    0,
    100 - nbMarqueurs * 20 - (debutsRep ? 10 : 0) - (verdictHumain ? 0 : 15)
  );
  return {
    skillSlug: "humanisation-100",
    skillName: "Humanisation 100 %",
    ordre: 5,
    gate: true,
    status:
      nbMarqueurs > 0
        ? "blocked"
        : issues.length
          ? "warned"
          : verdictHumain
            ? "passed"
            : "warned",
    score,
    summary: `Marqueurs IA : ${nbMarqueurs} (cible 0) · verdict ${verdictHumain ? "HUMAIN probable" : "style IA détectable"}`,
    issues,
    details,
    durationMs: t0() - start,
  };
}

/* ── Skill 6 : suppression-traces-ia (nettoyer_unicode.py) ────────────────── */
async function stepTraces(
  input: PipelineInput
): Promise<{ step: PipelineStepResult; cleanedContent: string }> {
  const start = t0();
  const stamp = `trace-${Date.now()}`;
  const file = await writeTmp(`${stamp}.md`, input.content);
  const inspect = await runPy(SCRIPTS.tracesUnicode, [file, "--inspecter"]);
  let cleaned = input.content;

  const aucun = inspect.stdout.includes("aucun caractère suspect détecté");
  const nbMatch = inspect.stdout.match(/===\s*(\d+)\s*caractère\(s\) suspect\(s\)/);
  const nbSuspects = aucun ? 0 : nbMatch ? Number(nbMatch[1]) : -1;

  const issues: StepIssue[] = [];
  const details: string[] = [];
  if (aucun) {
    details.push(
      inspect.stdout.match(/\((\d+) caractères analysés\)/)?.[1]
        ? `Zéro caractère suspect sur ${inspect.stdout.match(/\((\d+) caractères analysés\)/)![1]} caractères analysés ✓ (couche A watermarks-remover)`
        : "Zéro caractère suspect détecté ✓ (couche A watermarks-remover)"
    );
  } else if (nbSuspects > 0) {
    // Nettoyage automatique : le script écrit un .clean — on l'adopte
    const cleanRes = await runPy(SCRIPTS.tracesUnicode, [file]);
    const cleanedRaw = await readTmp(`${stamp}.md.clean`);
    if (cleanRes.code === 0 && cleanedRaw !== null) {
      cleaned = cleanedRaw;
      details.push(
        `${nbSuspects} caractère(s) invisible(s) détecté(s) (zero-width/bidi/homoglyphes/espaces exotiques) → nettoyés automatiquement, version .clean adoptée`
      );
      issues.push({
        level: "AVERTISSEMENT",
        message: `${nbSuspects} trace(s) Unicode supprimée(s) automatiquement (skill suppression-traces-ia) — vérifier la version nettoyée`,
      });
    } else {
      issues.push({
        level: "BLOQUANT",
        message: `${nbSuspects} caractère(s) suspect(s) et le nettoyage automatique a échoué — corriger à la main`,
      });
    }
  } else {
    issues.push({
      level: "BLOQUANT",
      message: "Skill suppression-traces-ia n'a pas rendu de rapport lisible",
    });
  }
  await cleanupTmp(stamp);
  return {
    step: {
      skillSlug: "suppression-traces-ia",
      skillName: "Suppression des traces IA",
      ordre: 6,
      gate: true,
      status: issues.some((i) => i.level === "BLOQUANT")
        ? "blocked"
        : nbSuspects > 0
          ? "warned"
          : "passed",
      score: issues.some((i) => i.level === "BLOQUANT") ? 0 : 100,
      summary: aucun
        ? "Zéro trace Unicode invisible ✓"
        : `${nbSuspects} trace(s) Unicode — ${issues.some((i) => i.level === "BLOQUANT") ? "nettoyage échoué" : "nettoyées automatiquement"}`,
      issues,
      details,
      durationMs: t0() - start,
    },
    cleanedContent: cleaned,
  };
}

/* ── Skill 7 : verification-contenu (GATE FINALE, check_contenu.py) ───────── */
async function stepVerification(
  content: string
): Promise<PipelineStepResult> {
  const start = t0();
  const stamp = `verif-${Date.now()}`;
  const file = await writeTmp(`${stamp}.md`, content);
  const res = await runPy(SCRIPTS.verification, [file, "--monetise"]);
  await cleanupTmp(stamp);
  const m = res.stdout.match(/:\s*(\d+)\s*bloquant\(s\),\s*(\d+)\s*avertissement\(s\)/);
  const ok = res.stdout.includes("OK pour relecture humaine");
  const issues: StepIssue[] = [];
  const details: string[] = [];

  for (const line of res.stdout.split("\n")) {
    const lm = line.match(/\[\s*(BLOQUANT|AVERTISSEMENT)\s*\]\s*(.*)/);
    if (lm) {
      issues.push({
        level: lm[1] as StepIssue["level"],
        message: lm[2].trim(),
      });
    }
  }
  details.push(
    ok
      ? "0 bloquant — reste l'étape 7 humaine : lecture à voix haute du début et de la FAQ"
      : "Contenu non conforme — corriger ou jeter (mieux vaut 0 page qu'une page fausse)"
  );

  if (!m) {
    return {
      skillSlug: "verification-contenu",
      skillName: "Vérification du contenu",
      ordre: 7,
      gate: true,
      status: "error",
      summary: "check_contenu.py n'a pas rendu de rapport",
      issues: [{ level: "BLOQUANT", message: res.stderr || "Erreur d'exécution du skill verification-contenu" }],
      durationMs: t0() - start,
    };
  }
  const bloquants = Number(m[1]);
  const avertissements = Number(m[2]);
  return {
    skillSlug: "verification-contenu",
    skillName: "Vérification du contenu",
    ordre: 7,
    gate: true,
    status: bloquants > 0 ? "blocked" : avertissements > 0 ? "warned" : "passed",
    score: Math.max(0, 100 - bloquants * 30 - avertissements * 5),
    summary: `GATE finale : ${bloquants} bloquant(s), ${avertissements} avertissement(s) — ${ok ? "OK" : "PAS PRÊT À PUBLIER"}`,
    issues,
    details,
    durationMs: t0() - start,
  };
}

/* ── Orchestration complète ───────────────────────────────────────────────── */
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const slug = computeSlug(input);

  // Étapes 1 à 6 indépendantes exécutées en parallèle pour diviser la latence
  // par 3–4 ; l'ordre canonique 1..7 et le chaînage de cleanedContent vers
  // l'étape 7 (verification-contenu) sont strictement préservés.
  const [blueOcean, gabarit, seo, geo, humanisation, traces] = await Promise.all([
    stepBlueOcean(input),
    stepGabarit(input),
    stepSeo(input, slug),
    stepGeo(input),
    stepHumanisation(input),
    stepTraces(input),
  ]);

  const verification = await stepVerification(traces.cleanedContent);
  const steps: PipelineStepResult[] = [
    blueOcean,
    gabarit,
    seo.step,
    geo,
    humanisation,
    traces.step,
    verification,
  ];

  const blockingIssues = steps.reduce(
    (acc, s) => acc + s.issues.filter((i) => i.level === "BLOQUANT").length,
    0
  );
  const warnings = steps.reduce(
    (acc, s) => acc + s.issues.filter((i) => i.level === "AVERTISSEMENT").length,
    0
  );
  const scored = steps.filter((s) => typeof s.score === "number");
  const overallScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length)
    : 0;

  const gateFailed = steps.some((s) => s.status === "blocked" || s.status === "error");
  return {
    status: gateFailed ? "blocked" : "passed",
    blockingIssues,
    warnings,
    overallScore,
    verdict: gateFailed
      ? "PAS PRÊT À PUBLIER — corrige les bloquants puis relance le pipeline (jamais de contenu non validé)"
      : "OK — publiable (relecture humaine du début et de la FAQ recommandée avant mise en ligne)",
    steps,
    cleanedContent: traces.cleanedContent,
    canPublish: !gateFailed,
  };
}

export { extractFaq, slugify, DISCLOSURE };
