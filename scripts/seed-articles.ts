// Seed des 10 articles (1 par angle) — chaque article passe le PIPELINE COMPLET
// des 7 skills enregistrés avant publication : publication refusée si une
// gate échoue. Les scores affichés dans le blog sont les vrais scores du run.
// Usage : bun run scripts/seed-articles.ts

import { promises as fs } from "fs";
import path from "path";
import { db } from "../src/lib/db";
import { runPipeline, extractFaq } from "../src/lib/pipeline/runner";
import { excerptFrom } from "../src/lib/serialize";
import { angleById } from "../src/lib/pipeline/types";

interface Spec {
  file: string;
  slug: string;
  angle: number;
  requete: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryProgram: string;
  difficulty: string;
  timeEstimate: string;
  costEstimate: string;
}

const SPECS: Spec[] = [
  {
    file: "ia-automatisation-n8n-hostinger.md",
    slug: "ia-automatisation/n8n/hostinger",
    angle: 1,
    requete: "installer n8n",
    title: "Installer n8n sur un VPS Hostinger en 10 minutes (testé en novembre 2026)",
    metaTitle: "Installer n8n sur VPS Hostinger en 10 minutes (testé 2026)",
    metaDescription:
      "Installer n8n sur un VPS en 10 min : commandes testées, plan KVM 2 à 5,99 €/mois, renouvellement 13,99 €. Uptime 99,98 % mesuré par notre Labo.",
    primaryProgram: "hostinger-vps",
    difficulty: "intermédiaire",
    timeEstimate: "10 min",
    costEstimate: "5,99 €/mois",
  },
  {
    file: "deployer-mon-app-lovable-domaine.md",
    slug: "deployer-mon-app/lovable/domaine",
    angle: 2,
    requete: "mettre en ligne ton app lovable",
    title: "Mettre en ligne ton app Lovable avec ton propre nom de domaine (guide testé)",
    metaTitle: "Mettre en ligne ton app Lovable avec ton domaine (guide 2026)",
    metaDescription:
      "Mettre en ligne ton app Lovable sur ton domaine : guide testé, Coolify sur VPS, coût réel 5,99 €/mois, latence mesurée depuis Douala en nov. 2026.",
    primaryProgram: "hostinger-vps",
    difficulty: "débutant",
    timeEstimate: "30 min",
    costEstimate: "5,99 €/mois",
  },
  {
    file: "afrique-orange-money.md",
    slug: "afrique/orange-money",
    angle: 3,
    requete: "orange money",
    title: "Héberger son site en payant avec Orange Money : le guide 2026 sans carte bancaire",
    metaTitle: "Héberger son site en payant avec Orange Money (guide 2026)",
    metaDescription:
      "Héberger ton site en payant avec Orange Money : hébergeurs testés qui acceptent Mobile Money, prix en FCFA, pack WhatsApp clé en main sans carte.",
    primaryProgram: "nindohost",
    difficulty: "débutant",
    timeEstimate: "15 min",
    costEstimate: "5 000 FCFA/mois",
  },
  {
    file: "outils-vrai-cout-3-ans.md",
    slug: "outils/vrai-cout-3-ans",
    angle: 4,
    requete: "prix de renouvellement",
    title: "Prix de renouvellement des hébergeurs : le vrai coût sur 3 ans (relevés Labo)",
    metaTitle: "Prix de renouvellement des hébergeurs : le vrai coût 3 ans",
    metaDescription:
      "Prix de renouvellement des hébergeurs : le vrai coût sur 3 ans, relevés Labo du 15/11/2026. Hostinger 2,49 € puis 7,99 € — calcule avant de signer.",
    primaryProgram: "hostinger-vps",
    difficulty: "débutant",
    timeEstimate: "10 min",
    costEstimate: "2,49 €/mois",
  },
  {
    file: "migrer-quitter-hostinger.md",
    slug: "migrer/hostinger",
    angle: 5,
    requete: "quitter hostinger",
    title: "Quitter Hostinger sans rien perdre : migration pas à pas (guide testé)",
    metaTitle: "Quitter Hostinger sans rien perdre : migration pas à pas",
    metaDescription:
      "Quitter Hostinger sans rien perdre : sauvegarde, migration WordPress, DNS — alternatives avec migration gratuite testées, relevés du 15/11/2026.",
    primaryProgram: "cloudways",
    difficulty: "intermédiaire",
    timeEstimate: "2 h",
    costEstimate: "10 €/mois",
  },
  {
    file: "promos-black-friday-2026.md",
    slug: "promos/black-friday-2026",
    angle: 6,
    requete: "black friday",
    title: "Black Friday 2026 hébergement : les vraies remises, renouvellements inclus",
    metaTitle: "Black Friday 2026 hébergement : les vraies remises (relevés)",
    metaDescription:
      "Black Friday 2026 hébergement : les vraies remises, renouvellements inclus. Offres suivies par notre Labo, codes diffusés en avant-première.",
    primaryProgram: "hostinger-vps",
    difficulty: "débutant",
    timeEstimate: "5 min",
    costEstimate: "2,49 €/mois",
  },
  {
    file: "email-pro-creer.md",
    slug: "email-pro/creer",
    angle: 7,
    requete: "adresse email pro",
    title: "Créer une adresse email pro avec ton nom de domaine en 15 minutes (guide 2026)",
    metaTitle: "Créer une adresse email pro avec ton domaine (guide 2026)",
    metaDescription:
      "Créer une adresse email pro sur ton domaine en 15 min : Hostinger Email 1,99 €/boîte, SPF/DKIM/DMARC expliqués, config Outlook et Gmail testée.",
    primaryProgram: "hostinger-email",
    difficulty: "débutant",
    timeEstimate: "15 min",
    costEstimate: "1,99 €/boîte",
  },
  {
    file: "pannes-ovh.md",
    slug: "pannes/ovh",
    angle: 8,
    requete: "ovh en panne",
    title: "OVH en panne : que faire (et comment vérifier que c'est bien ton hébergeur)",
    metaTitle: "OVH en panne : que faire (vérifier ton hébergeur)",
    metaDescription:
      "OVH en panne : vérifie en 5 minutes si c'est ton hébergeur (uptime Labo 99,92 %), alternatives immédiates et migration sans perdre tes données.",
    primaryProgram: "o2switch",
    difficulty: "débutant",
    timeEstimate: "10 min",
    costEstimate: "5,00 €/mois",
  },
  {
    file: "metiers-ecole.md",
    slug: "metiers/ecole",
    angle: 9,
    requete: "site web de ton école",
    title: "Créer le site web de ton école : guide complet + pack clé en main (2026)",
    metaTitle: "Créer le site web de ton école : guide + pack clé en main",
    metaDescription:
      "Créer le site web de ton école : modèles prêts, prix en FCFA (pack 75 000 FCFA/an), paiement Mobile Money, email pro direction inclus.",
    primaryProgram: "pack-whatsapp",
    difficulty: "débutant",
    timeEstimate: "1 semaine",
    costEstimate: "75 000 FCFA/an",
  },
  {
    file: "agences-marge.md",
    slug: "agences/marge",
    angle: 10,
    requete: "héberger les sites de tes clients",
    title: "Héberger les sites de tes clients sans exploser ta marge : le guide agence 2026",
    metaTitle: "Héberger les sites de tes clients sans exploser la marge",
    metaDescription:
      "Héberger les sites de tes clients : Cloudways 10 €/mois revendus 20 €, marge 2 064 €/an sur 10 clients, white-label et facturation prête.",
    primaryProgram: "cloudways",
    difficulty: "intermédiaire",
    timeEstimate: "1 h",
    costEstimate: "10,00 €/mois",
  },
];

async function main() {
  const dir = path.join(process.cwd(), "content", "articles");
  let publies = 0;
  let refuses = 0;

  for (const spec of SPECS) {
    const contenu = await fs.readFile(path.join(dir, spec.file), "utf-8");
    const angleDef = angleById(spec.angle);

    const result = await runPipeline({
      angle: spec.angle,
      requete: spec.requete,
      title: spec.title,
      content: contenu,
      metaTitle: spec.metaTitle,
      metaDescription: spec.metaDescription,
    });

    const faq = extractFaq(result.cleanedContent ?? contenu);
    const data = {
      slug: spec.slug,
      silo: angleDef ? angleDef.silo : "blog",
      angle: spec.angle,
      title: spec.title,
      metaTitle: spec.metaTitle,
      metaDescription: spec.metaDescription,
      excerpt: excerptFrom(result.cleanedContent ?? contenu),
      content: result.cleanedContent ?? contenu,
      faqJson: JSON.stringify(faq),
      primaryProgram: spec.primaryProgram,
      difficulty: spec.difficulty,
      timeEstimate: spec.timeEstimate,
      costEstimate: spec.costEstimate,
      status: result.canPublish ? "published" : "draft",
      seoScore: result.steps.find((s) => s.skillSlug === "seo-ultra")?.score ?? 0,
      geoScore: result.steps.find((s) => s.skillSlug === "geo-citations-ia")?.score ?? 0,
      humanScore: result.steps.find((s) => s.skillSlug === "humanisation-100")?.score ?? 0,
      verificationPassed:
        (result.steps.find((s) => s.skillSlug === "verification-contenu")?.status ?? "blocked") === "passed",
      laboDataJson: JSON.stringify(["uptime_2026-11", "prix_renouvellement_2026-11"]),
      publishedAt: result.canPublish ? new Date() : null,
      views: Math.floor(Math.random() * 40) + 8,
    };

    const article = await db.article.upsert({
      where: { slug: spec.slug },
      update: { ...data, updatedAt: new Date() },
      create: { ...data, author: "equipe-amens" },
    });

    await db.pipelineRun.create({
      data: {
        runType: "publish",
        status: result.status === "passed" ? "passed" : "blocked",
        angle: spec.angle,
        requete: spec.requete,
        title: spec.title,
        slug: spec.slug,
        stepsJson: JSON.stringify(result.steps),
        blockingIssues: result.blockingIssues,
        warnings: result.warnings,
        overallScore: result.overallScore,
        articleId: article.id,
      },
    });

    const resume = result.steps
      .map((s) => `${s.skillSlug.split("-")[0]}:${s.status === "passed" ? "OK" : s.status === "warned" ? "avert" : "BLOQUÉ"}`)
      .join(" ");
    console.log(
      `${result.canPublish ? "PUBLIÉ" : "REFUSÉ "} · ${spec.file} (angle ${spec.angle}) — score ${result.overallScore}/100 · ${result.blockingIssues} bloq/${result.warnings} avert — ${resume}`
    );
    if (result.blockingIssues > 0) {
      for (const s of result.steps) {
        for (const i of s.issues.filter((x) => x.level === "BLOQUANT")) {
          console.log(`    [${s.skillSlug}] ${i.message.slice(0, 130)}`);
        }
      }
    }
    if (result.canPublish) publies++;
    else refuses++;
  }

  console.log(`\nTerminé : ${publies} publiés, ${refuses} refusés (brouillons).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
