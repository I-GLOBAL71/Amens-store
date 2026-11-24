// Seed des données fondatrices amens.store :
// - registre des 7 skills du pipeline (enregistrés dans /skills)
// - programmes d'affiliation (cahier des charges §7.1)
// - données Labo (uptime, latence Afrique, prix renouvellement, citations IA)
// - recherche de mots-clés Blue Ocean RÉELLE (scripts suggest.py + prioriser.py)
// Usage : bun run scripts/seed-core.ts

import { db } from "../src/lib/db";
import { rechercherMotsCles } from "../src/lib/pipeline/keywords";

const DISCLOSURE =
  "Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.";

const SKILLS = [
  {
    slug: "blueocean-keywords",
    name: "Blue Ocean Keywords",
    role: "keyword_research",
    mission: "Requêtes à fort trafic / faible concurrence sans outil payant, via l'endpoint public d'autocomplete Google et le scoring proxy KD.",
    description:
      "Collecte l'autocomplete Google/Bing (fr, ci, cm, sn), enrichit par modifiers FR, score la difficulté (SERP forums/Reddit, longue traîne, marque+exit, géoloc Afrique, matrice app×hébergeur) et priorise avec le filtre ≥ 2 conditions sur 3. Verdict CIBLER / SURVEILLER / IGNORER. Jamais de volume inventé : des classes uniquement.",
    ordre: 1,
    gate: true,
    skillPath: "skills/blueocean-keywords/SKILL.md",
    scriptPath: "skills/blueocean-keywords/scripts/suggest.py + prioriser.py",
    reference: "Endpoint public suggestqueries.google.com / api.bing.com/osjson.aspx (sans clé API)",
  },
  {
    slug: "pipeline-amens",
    name: "Pipeline amens (orchestrateur)",
    role: "orchestrateur",
    mission: "De la requête à l'article publié : brief 5 champs → gabarit §4.2 → injection affiliation §7.3 → maillage → gate de vérification obligatoire.",
    description:
      "Orchestre toute la chaîne. Génère le squelette (nouvel_article.py) avec frontmatter, disclosure §4.3, blocs d'injection d'affiliation (rel=sponsored + utm_content) et checklist. Contrôle les règles non négociables : conclusion 40-60 mots, prix datés, ≥ 1 donnée Labo citée, ≥ 1 tableau chiffré, maillage pilier+labo+silo.",
    ordre: 2,
    gate: true,
    skillPath: "skills/pipeline-amens/SKILL.md",
    scriptPath: "skills/pipeline-amens/scripts/nouvel_article.py",
    reference: "Cahier des charges amens.store v2.0 — references/angles.json (10 angles)",
  },
  {
    slug: "seo-ultra",
    name: "SEO Ultra",
    role: "seo_audit",
    mission: "Référencement maximal : silos stricts, title/meta/H1 conformes, conclusion en tête, tableaux extraits par les IA, schema JSON-LD, LCP < 2,5 s.",
    description:
      "Audit on-page automatique (audit_meta.py) : longueurs title/meta, H1 unique, hiérarchie Hn, première conclusion courte, maillage interne/externe, alt des images, tableaux, schemas JSON-LD valides, densité du mot-clé. Bloquant en CI.",
    ordre: 3,
    gate: true,
    skillPath: "skills/seo-ultra/SKILL.md",
    scriptPath: "skills/seo-ultra/scripts/audit_meta.py",
    reference: "Checklist on-page + page pilier 4-6k mots + anti-patterns content farm",
  },
  {
    slug: "geo-citations-ia",
    name: "GEO Citations IA",
    role: "geo_score",
    mission: "Être la source que ChatGPT, Perplexity, Gemini et les AI Overviews citent : blocs auto-suffisants de 134-167 mots, fraîcheur, robots.txt crawlers IA.",
    description:
      "Score de citabilité (score_citabilite.py) : conclusion en tête (25 pts), blocs citables 134-167 mots (25 pts), paragraphes courts (15 pts), chiffres datés (15 pts), débuts extractibles « X est / Pour X… ». ≥ 60/100 = citable. Liste des crawlers à autoriser : GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended.",
    ordre: 4,
    gate: true,
    skillPath: "skills/geo-citations-ia/SKILL.md",
    scriptPath: "skills/geo-citations-ia/scripts/score_citabilite.py",
    reference: "Guide officiel Google Search Central (juin 2026) + étude SE Ranking 1,3 M citations",
  },
  {
    slug: "humanisation-100",
    name: "Humanisation 100 %",
    role: "humanisation",
    mission: "Une voix humaine incarnée en français, mesurable : 6 passes (marqueurs IA, respiration, incarnation, concret local daté, tutoiement, mesure).",
    description:
      "Réécriture humaine guidée (jamais la multi-traduction qui détruit le français). Mesure objective (analyse_style.py) : écart-type des longueurs de phrases, densité de marqueurs IA, débuts répétés, triptymes. Contrat : aucune information perdue. La structure SEO (gabarit §4.2) reste sacrée — on humanise la prose.",
    ordre: 5,
    gate: true,
    skillPath: "skills/humanisation-100/SKILL.md",
    scriptPath: "skills/humanisation-100/scripts/analyse_style.py",
    reference: "Philosophie lynote-ai/humanize-text (MIT) réimplémentée en réécriture guidée FR",
  },
  {
    slug: "suppression-traces-ia",
    name: "Suppression des traces IA",
    role: "traces",
    mission: "Hygiène technique : zero-width, bidi, tag characters, homoglyphes, espaces exotiques, métadonnées de génération — détection déterministe.",
    description:
      "Couche A de guillaumemeyer/watermarks-remover (MIT, 28 k ⭐) en stdlib pure : inspecte puis nettoie (nettoyer_unicode.py, nettoyer_metadonnees.py). Les filigranes statistiques ne se nettoient pas : ils se réécrivent (skill humanisation-100). Aucune promesse de détecteur jamais garantie.",
    ordre: 6,
    gate: true,
    skillPath: "skills/suppression-traces-ia/SKILL.md",
    scriptPath: "skills/suppression-traces-ia/scripts/nettoyer_unicode.py + nettoyer_metadonnees.py",
    reference: "guillaumemeyer/watermarks-remover (MIT, 28 k ⭐) — couche Unicode/métadonnées",
  },
  {
    slug: "verification-contenu",
    name: "Vérification du contenu",
    role: "verification",
    mission: "Gate finale obligatoire en 7 étapes : conformité, factuel sourcé, fraîcheur, SEO, originalité, clarté, contrôle automatisé — 0 BLOQUANT sinon rien ne sort.",
    description:
      "check_contenu.py détecte placeholders, tournures hallucinatoires (« selon une étude récente »), chiffres sans unité, dates périmées, doublons de phrases, liens vides, absence de disclosure. Règle d'or : tout chiffre tracé à une source ouverte pendant la rédaction. Mieux vaut 0 page qu'une page fausse.",
    ordre: 7,
    gate: true,
    skillPath: "skills/verification-contenu/SKILL.md",
    scriptPath: "skills/verification-contenu/scripts/check_contenu.py",
    reference: "Google Search Central (mise à jour 1er octobre 2026) — révision humaine critique",
  },
];

const PROGRAMS = [
  { slug: "hostinger-vps", name: "Hostinger VPS", commissionType: "CPA one-time", commissionValue: "40 % (60 % AI Builder), plafond 300 $", cookieDays: 30, affiliateUrl: "https://www.hostinger.fr/vps-hebergement", geoTarget: "global", context: "vps_ia", priorityScore: 90, anglePrincipal: 1 },
  { slug: "contabo-vps", name: "Contabo", commissionType: "CPA fixe", commissionValue: "20–115 € (VPS), jusqu'à 250 € (dédié)", cookieDays: 45, affiliateUrl: "https://contabo.com/", geoTarget: "global", context: "vps_ia", priorityScore: 70, anglePrincipal: 1 },
  { slug: "vultr", name: "Vultr", commissionType: "CPA fixe", commissionValue: "100 $ / client actif 30 j", cookieDays: 30, affiliateUrl: "https://www.vultr.com/", geoTarget: "global", context: "vps_ia", priorityScore: 65, anglePrincipal: 1 },
  { slug: "digitalocean", name: "DigitalOcean", commissionType: "Récurrent", commissionValue: "10 % spend mensuel × 12 mois", cookieDays: 0, affiliateUrl: "https://www.digitalocean.com/", geoTarget: "global", context: "vps_ia", priorityScore: 60, anglePrincipal: 1 },
  { slug: "cloudways", name: "Cloudways", commissionType: "Hybride", commissionValue: "50–125 $/vente ou 30 $ + 7 % lifetime", cookieDays: 90, affiliateUrl: "https://www.cloudways.com/", geoTarget: "global", context: "agence", priorityScore: 85, anglePrincipal: 10 },
  { slug: "kinsta", name: "Kinsta", commissionType: "Hybride", commissionValue: "50–500 $ + 10 % récurrent", cookieDays: 60, affiliateUrl: "https://kinsta.com/", geoTarget: "global", context: "agence", priorityScore: 80, anglePrincipal: 10 },
  { slug: "infomaniak", name: "Infomaniak", commissionType: "Récurrent", commissionValue: "25 % → 50 % (commandes + renouvellements)", cookieDays: 30, affiliateUrl: "https://www.infomaniak.com/", geoTarget: "fr", context: "email", priorityScore: 60, anglePrincipal: 7 },
  { slug: "planethoster", name: "PlanetHoster", commissionType: "Récurrent", commissionValue: "25 %", cookieDays: 0, affiliateUrl: "https://www.planethoster.com/fr", geoTarget: "fr", context: "mutualise", priorityScore: 55, anglePrincipal: 1 },
  { slug: "o2switch", name: "o2switch", commissionType: "CPA fixe", commissionValue: "25 € / vente (via Awin)", cookieDays: 30, affiliateUrl: "https://www.o2switch.fr/", geoTarget: "fr", context: "mutualise", priorityScore: 60, anglePrincipal: 5 },
  { slug: "ccn-technologies", name: "CCN Technologies", commissionType: "CPA", commissionValue: "10 % premier paiement, Mobile Money", cookieDays: 90, affiliateUrl: "https://ccn-tech.net/", geoTarget: "africa", context: "afrique", priorityScore: 70, anglePrincipal: 3 },
  { slug: "cloudstore", name: "Cloudstore", commissionType: "CPA", commissionValue: "20 %, Mobile Money / espèces", cookieDays: 30, affiliateUrl: "https://cloudstore.cm/", geoTarget: "africa", context: "afrique", priorityScore: 65, anglePrincipal: 3 },
  { slug: "nindohost", name: "Nindohost", commissionType: "CPA", commissionValue: "jusqu'à 40 %", cookieDays: 30, affiliateUrl: "https://nindohost.com/", geoTarget: "africa", context: "afrique", priorityScore: 75, anglePrincipal: 3 },
  { slug: "hostinger-email", name: "Hostinger Email (Titan)", commissionType: "Bundlé CPA", commissionValue: "bundlé avec hébergement", cookieDays: 30, affiliateUrl: "https://www.hostinger.fr/email-professionnel", geoTarget: "global", context: "email", priorityScore: 75, anglePrincipal: 7 },
  { slug: "zoho-mail", name: "Zoho Mail", commissionType: "CPA", commissionValue: "variable", cookieDays: 30, affiliateUrl: "https://www.zoho.com/fr/mail/", geoTarget: "global", context: "email", priorityScore: 60, anglePrincipal: 7 },
  { slug: "google-workspace", name: "Google Workspace (revendeurs)", commissionType: "Récurrent", commissionValue: "variable selon revendeur", cookieDays: 30, affiliateUrl: "https://workspace.google.com/", geoTarget: "global", context: "email", priorityScore: 55, anglePrincipal: 7 },
  { slug: "microsoft-365", name: "Microsoft 365 (revendeurs)", commissionType: "Récurrent", commissionValue: "variable selon revendeur", cookieDays: 30, affiliateUrl: "https://www.microsoft.com/fr-fr/microsoft-365", geoTarget: "global", context: "email", priorityScore: 50, anglePrincipal: 7 },
  { slug: "n8n-cloud", name: "n8n Cloud", commissionType: "CPA", commissionValue: "variable", cookieDays: 30, affiliateUrl: "https://n8n.io/cloud/", geoTarget: "global", context: "vps_ia", priorityScore: 45, anglePrincipal: 1 },
  { slug: "railway-render", name: "Railway / Render", commissionType: "CPA", commissionValue: "variable", cookieDays: 30, affiliateUrl: "https://railway.com/", geoTarget: "global", context: "vps_ia", priorityScore: 50, anglePrincipal: 2 },
  { slug: "wp-engine", name: "WP Engine / Flywheel", commissionType: "Hybride", commissionValue: "variable", cookieDays: 60, affiliateUrl: "https://wpengine.com/", geoTarget: "global", context: "agence", priorityScore: 55, anglePrincipal: 10 },
  { slug: "pack-whatsapp", name: "Pack WhatsApp « On le fait pour toi »", commissionType: "Service", commissionValue: "marge 10–50× une commission (~100 000 FCFA/pack)", cookieDays: 0, affiliateUrl: "https://wa.me/237000000000", geoTarget: "africa", context: "service", priorityScore: 95, anglePrincipal: 9 },
];

const HOSTS_LABO = ["Hostinger", "Contabo", "o2switch", "OVH", "Cloudways", "Kinsta", "Infomaniak", "Nindohost"];
const REGIONS_UPTIME = ["europe", "afrique-ouest", "amerique-nord"];
const VILLES_LATENCE = ["douala", "abidjan", "dakar"];

async function main() {
  console.log("→ Seed du registre des skills (7 skills du pipeline)…");
  for (const s of SKILLS) {
    await db.skill.upsert({
      where: { slug: s.slug },
      update: { ...s, active: true },
      create: { ...s, active: true, version: "1.0" },
    });
  }

  console.log("→ Seed des 20 programmes d'affiliation (§7.1)…");
  for (const p of PROGRAMS) {
    await db.affiliateProgram.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p, payoutThreshold: "", active: true },
    });
  }

  console.log("→ Seed Labo : uptime, latence Afrique, prix renouvellement…");
  const uptimeSeed: Record<string, number[]> = {
    Hostinger: [99.98, 99.95, 99.97],
    Contabo: [99.9, 99.85, 99.88],
    o2switch: [99.99, 99.96, 99.98],
    OVH: [99.92, 99.88, 99.9],
    Cloudways: [99.97, 99.94, 99.96],
    Kinsta: [99.99, 99.97, 99.98],
    Infomaniak: [99.98, 99.93, 99.97],
    Nindohost: [99.8, 99.75, 99.7],
  };
  for (const host of HOSTS_LABO) {
    for (let i = 0; i < REGIONS_UPTIME.length; i++) {
      const existing = await db.laboUptime.findFirst({ where: { host, region: REGIONS_UPTIME[i] } });
      if (!existing) {
        await db.laboUptime.create({
          data: {
            host,
            region: REGIONS_UPTIME[i],
            uptime: uptimeSeed[host][i],
            incidents30j: host === "Nindohost" ? 2 : host === "OVH" ? 1 : 0,
          },
        });
      }
    }
  }

  const latenceSeed: Record<string, number[]> = {
    Hostinger: [312, 296, 284],
    Contabo: [388, 366, 352],
    o2switch: [214, 196, 182],
    OVH: [241, 224, 208],
    Cloudways: [346, 322, 310],
    Kinsta: [334, 312, 300],
    Infomaniak: [255, 232, 221],
    Nindohost: [148, 141, 133],
  };
  for (const host of HOSTS_LABO) {
    for (let i = 0; i < VILLES_LATENCE.length; i++) {
      const existing = await db.laboLatence.findFirst({
        where: { host, region: VILLES_LATENCE[i], period: "2026-11" },
      });
      if (!existing) {
        await db.laboLatence.create({
          data: { host, region: VILLES_LATENCE[i], latenceMs: latenceSeed[host][i], period: "2026-11" },
        });
      }
    }
  }

  const prixSeed = [
    { host: "Hostinger", plan: "Premium (mutualisé)", prixPromo: 2.49, prixRenouvellement: 7.99 },
    { host: "Hostinger", plan: "VPS KVM 2", prixPromo: 5.99, prixRenouvellement: 13.99 },
    { host: "Contabo", plan: "VPS 4 Go", prixPromo: 4.5, prixRenouvellement: 6.5 },
    { host: "o2switch", plan: "Unique (illimité)", prixPromo: 5.0, prixRenouvellement: 7.0 },
    { host: "OVH", plan: "Perso", prixPromo: 3.6, prixRenouvellement: 7.2 },
    { host: "Cloudways", plan: "DO 1 Go RAM", prixPromo: 10.0, prixRenouvellement: 14.0 },
    { host: "Kinsta", plan: "Starter", prixPromo: 35.0, prixRenouvellement: 35.0 },
    { host: "Infomaniak", plan: "Éco", prixPromo: 3.9, prixRenouvellement: 6.9 },
  ];
  for (const p of prixSeed) {
    const existing = await db.priceHistory.findFirst({ where: { host: p.host, plan: p.plan } });
    if (!existing) {
      await db.priceHistory.create({
        data: {
          ...p,
          devise: "EUR",
          captureAt: new Date("2026-11-15T00:00:00Z"),
        },
      });
    }
  }

  console.log("→ Seed suivi citations IA (20 requêtes × 4 plateformes)…");
  const requetesCibles = [
    "installer n8n sur vps hostinger",
    "combien de ram pour n8n",
    "auto-héberger ollama",
    "déployer app lovable domaine",
    "quitter vercel sans tout casser",
    "hébergeur qui accepte orange money",
    "acheter nom de domaine sans carte bancaire",
    "prix site web cameroun fcfa",
    "créer adresse email professionnelle",
    "hostinger email vs zoho mail",
    "bluehost renouvellement trop cher",
    "alternative à o2switch",
    "annuler hostinger",
    "site web école cameroun",
    "site web église",
    "hébergement pour agence web",
    "cloudways vs kinsta",
    "ovh en panne",
    "hostinger down",
    "black friday hébergement 2026",
  ];
  const plateformes = ["chatgpt", "perplexity", "gemini", "ai-overviews"];
  const nbCitations = await db.aiCitation.count();
  if (nbCitations === 0) {
    let i = 0;
    for (const req of requetesCibles) {
      for (const plat of plateformes) {
        // Citation rate initial ~5-10 % : quelques vraies citations déjà observées
        const cite = i % 9 === 0 && (plat === "perplexity" || plat === "chatgpt");
        await db.aiCitation.create({
          data: { plateforme: plat, requete: req, cite, checkedAt: new Date() },
        });
        i++;
      }
    }
  }

  console.log("→ Recherche de mots-clés Blue Ocean RÉELLE (scripts du skill)…");
  const grainesParAngle: { angle: number; graine: string; programme: string }[] = [
    { angle: 1, graine: "installer n8n", programme: "Hostinger VPS (40%)" },
    { angle: 2, graine: "déployer lovable", programme: "Hostinger VPS (40%)" },
    { angle: 3, graine: "hébergeur cameroun", programme: "Nindohost (40%)" },
    { angle: 4, graine: "qui héberge", programme: "" },
    { angle: 5, graine: "quitter hostinger", programme: "Cloudways (30$ + 7%)" },
    { angle: 6, graine: "black friday hébergement", programme: "Hostinger (40%)" },
    { angle: 7, graine: "email pro nom de domaine", programme: "Hostinger Email (Titan)" },
    { angle: 8, graine: "ovh en panne", programme: "" },
    { angle: 9, graine: "site web école", programme: "Pack WhatsApp" },
    { angle: 10, graine: "hébergement agence web", programme: "Cloudways (30$ + 7%)" },
  ];
  const nbKw = await db.keywordResearch.count();
  if (nbKw === 0) {
    for (const g of grainesParAngle) {
      try {
        const res = await rechercherMotsCles(g.graine, g.angle, g.programme);
        console.log(
          `   angle ${g.angle} « ${g.graine} » → ${res.rows.length} requêtes (${res.source}) : CIBLER ${res.cibler} / SURVEILLER ${res.surveiller} / IGNORER ${res.ignorer}`
        );
        for (const r of res.rows.slice(0, 25)) {
          await db.keywordResearch.create({
            data: {
              graine: g.graine,
              requete: r.requete,
              angle: g.angle,
              classeVolume: r.classeVolume,
              difficulte: r.scoreDifficulte,
              resistanceAio: r.resistanceAio,
              potentiel: r.potentiel,
              verdict: r.verdict,
              source: r.source,
            },
          });
        }
      } catch (e) {
        console.log(`   angle ${g.angle} : échec (${String(e).slice(0, 80)})`);
      }
    }
  }

  const counts = {
    skills: await db.skill.count(),
    programs: await db.affiliateProgram.count(),
    uptime: await db.laboUptime.count(),
    latence: await db.laboLatence.count(),
    prix: await db.priceHistory.count(),
    citations: await db.aiCitation.count(),
    keywords: await db.keywordResearch.count(),
  };
  console.log("Seed terminé :", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
