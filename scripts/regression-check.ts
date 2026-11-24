#!/usr/bin/env bun
// ═════════════════════════════════════════════════════════════════════════════
// SENTINELLE ANTI-RÉGRESSION — amens.store
//
// Rôle : garantir qu'aucune implémentation future ne détruise ou ne fasse
// régresser les fonctionnalités déjà présentes (politique complète : GUARDRAILS.md).
//
// Usage :
//   bun run verify:regression   → vérification complète (code sortie 0 si vert)
//   bun run baseline:update     → recapture des seuils — FORCE MAJEURE
//                                 uniquement, motif à documenter dans GUARDRAILS.md
//
// Ce que la sentinelle vérifie :
//   1. Qualité    : lint eslint du projet
//   2. Serveur    : GET / joignable + HTML SSR contenant les vraies valeurs
//                   croisées avec /api/labo (le correctif « haut de page vide »
//                   ne doit JAMAIS régresser — aucun placeholder, SSR réel)
//   3. APIs       : /api/labo, /api/articles, /api/sante (formes + seuils
//                   planchers de config/regression-baseline.json)
//   4. Navigateur : couverture du 4/5 supérieur de l'accueil (desktop + mobile
//                   393px), hydratation (vraies valeurs rendues), les 7 vues
//                   rendent leur marqueur protégé, zéro erreur de page
//   5. Invisibilité visiteur : aucun terme stratégique (SEO/GEO/AIO…) dans le
//                   TEXTE VISIBLE de la surface visiteur (vues reliées dans la
//                   navigation ; le Studio est un dashboard interne — rendu
//                   vérifié, libellés internes hors périmètre)
//
// Fichiers : config/regression-baseline.json (seuils protégés)
//            config/regression-last-run.json (dernier rapport)
// ═════════════════════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ANGLES } from "../src/lib/pipeline/types";

/* ── Configuration ─────────────────────────────────────────────────────────── */

const ROOT = process.cwd();
const BASE = process.env.AMENS_BASE_URL ?? "http://127.0.0.1:3000";
const AB_BIN = process.env.AMENS_BROWSER_BIN ?? "agent-browser";
const SESSION = "amens-sentinelle";
const CHEMIN_BASELINE = resolve(ROOT, "config/regression-baseline.json");
const CHEMIN_RAPPORT = resolve(ROOT, "config/regression-last-run.json");

/* ── Marqueurs protégés (chaînes UI réellement affichées — tamper-evident) ─── */

const MARQUEURS_ACCUEIL: string[] = [
  "Mets en ligne tes projets IA, tes apps, ton site et ton email pro",
  "Guides testés · prix datés · données Labo publiques",
  "Assistant — 3 questions, ton hébergeur",
  "Guides testés en ligne",
  "Uptime moyen Labo (8 hébergeurs)",
  "Tarifs d’hébergement suivis",
  "Latence mesurée depuis Douala",
  "Orange Money, MTN MoMo, Wave",
  "Explorer le blog",
];

interface ConfigVue {
  nom: string;
  url: string;
  marqueur: string;
  /** true = les termes stratégiques y sont interdits (surface visiteur) */
  invisibilite: boolean;
  /** true = tolère en ALERTE les termes pouvant apparaître légitimement dans du contenu rédactionnel */
  alertesContenu?: boolean;
}

const VUES: ConfigVue[] = [
  { nom: "blog", url: "/?v=blog", marqueur: "guides d'exécution testés", invisibilite: true, alertesContenu: true },
  { nom: "labo", url: "/?v=labo", marqueur: "Le Labo amens.store — mesures publiques", invisibilite: true },
  { nom: "outils", url: "/?v=outils", marqueur: "Les outils qui calculent ce que les comparateurs cachent", invisibilite: true },
  { nom: "promos", url: "/?v=promos", marqueur: "les vraies remises (renouvellement inclus)", invisibilite: true },
  // Studio = dashboard interne de production (non relié dans la navigation,
  // non rendu dans le HTML SSR) : on vérifie le RENDU, pas les libellés internes.
  { nom: "studio", url: "/?v=studio", marqueur: "Studio Pipeline", invisibilite: false },
];

/* ── Invisibilité visiteur : fuites de stratégie interdites dans le visible ── */

// Termes dont la seule présence dans le texte visible prouve une fuite de
// stratégie interne → ÉCHEC où qu'ils apparaissent (surface visiteur).
const INTERDITS_FORTS: string[] = [
  "AI Overviews",
  "AIO",
  "GEO citations",
  "citation IA",
  "Blue Ocean",
  "blueocean",
  "GSC",
  "Semrush",
  "Ahrefs",
  "KD proxy",
  "SEO ultra",
  "llms.txt",
];

// Termes supplémentaires interdits sur l'accueil (surface 100 % maîtrisée).
const INTERDITS_ACCUEIL: string[] = [
  ...INTERDITS_FORTS,
  "SEO",
  "GEO",
  "référencement",
  "ChatGPT",
  "Perplexity",
  "Gemini",
  "cité par",
  "optimisé pour",
];

// Mêmes termes, tolérés en simple ALERTE sur les vues affichant du contenu
// rédactionnel (un guide peut légitimement parler de ChatGPT à ses lecteurs).
const ALERTES_CONTENU: string[] = [
  "SEO",
  "GEO",
  "référencement",
  "ChatGPT",
  "Perplexity",
  "Gemini",
  "cité par",
  "optimisé pour",
];

/* ── Types ────────────────────────────────────────────────────────────────── */

interface Verdict {
  groupe: string;
  nom: string;
  ok: boolean;
  detail: string;
  gravite: "erreur" | "alerte";
}

interface LaboJson {
  uptime: { host: string; region: string; uptime: number; incidents30j: number }[];
  latence: { host: string; region: string; latenceMs: number }[];
  prix: { host: string; plan: string }[];
  citations: { plateforme: string; requete: string; cite: boolean }[];
  kpi: {
    citationRate: number;
    citationRateDetail: string;
    avgUptime: Record<string, number>;
    latenceAfrique: Record<string, number>;
    methodologie: string;
  };
}

interface ArticlesJson {
  articles: { slug: string; title: string; status: string; excerpt: string; content: string; silo?: string }[];
  siloCounts: { silo: string; count: number }[];
}

interface Compte {
  articlesPublies: number;
  hebergeursLabo: number;
  lignesUptime: number;
  lignesLatence: number;
  lignesPrix: number;
}

interface RapportVue {
  longueur: number;
  marqueurPresent: boolean;
  interditsTrouves: string[];
  alertes: string[];
}

interface RapportAccueil {
  longueur: number;
  marqueursManquants: string[];
  couverture: (string | null)[];
  valeursRendues: string[];
  interditsTrouves: string[];
  structure: { entete: boolean; principal: boolean; pied: boolean };
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const verdicts: Verdict[] = [];
function ver(groupe: string, nom: string, ok: boolean, detail = "", gravite: "erreur" | "alerte" = "erreur") {
  verdicts.push({ groupe, nom, ok, detail, gravite });
}

function ab(args: string[], timeoutMs = 60_000): string {
  return execFileSync(AB_BIN, ["--session", SESSION, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: timeoutMs,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** Ouvre une URL du site, attend le réseau + un court délai d'animation. */
function abOuvrir(chemin: string): boolean {
  try {
    ab(["open", BASE + chemin], 90_000);
  } catch {
    return false;
  }
  try {
    ab(["wait", "--load", "networkidle"], 45_000);
  } catch {
    /* page déjà chargée ou réseau lent : toléré, les marqueurs décideront */
  }
  try {
    ab(["wait", "700"]);
  } catch {
    /* toléré */
  }
  return true;
}

/** Évalue du JS dans la page courante ; renvoie l'objet parsé. */
function abEval(js: string): { ok: boolean; valeur: Record<string, unknown> | null; erreur: string } {
  try {
    const sortie = JSON.parse(ab(["eval", js, "--json"]));
    if (sortie?.success !== true) {
      return { ok: false, valeur: null, erreur: String(sortie?.error ?? "eval en échec") };
    }
    const brut = sortie.data?.result;
    const valeur = typeof brut === "string" ? JSON.parse(brut) : brut;
    return { ok: true, valeur: valeur as Record<string, unknown> | null, erreur: "" };
  } catch (e) {
    return { ok: false, valeur: null, erreur: String((e as Error).message).slice(0, 200) };
  }
}

/** Erreurs de page (console/pageerror) — lues puis remises à zéro. */
function abErreursPage(): { nombre: number; detail: string } {
  try {
    const sortie = JSON.parse(ab(["errors", "--json"]));
    const liste: unknown[] = sortie?.data?.errors ?? [];
    if (liste.length > 0) {
      try {
        ab(["errors", "--clear"]);
      } catch {
        /* toléré */
      }
    }
    return { nombre: liste.length, detail: liste.slice(0, 3).map(String).join(" | ").slice(0, 200) };
  } catch (e) {
    return { nombre: -1, detail: String((e as Error).message).slice(0, 120) };
  }
}

async function httpJson(url: string): Promise<{ ok: boolean; statut: number; data: unknown }> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const data = await r.json().catch(() => null);
    return { ok: r.ok && data !== null, statut: r.status, data };
  } catch {
    return { ok: false, statut: 0, data: null };
  }
}

async function httpTexte(url: string): Promise<{ ok: boolean; texte: string }> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const texte = await r.text();
    return { ok: r.ok, texte };
  } catch {
    return { ok: false, texte: "" };
  }
}

const contient = (foin: string, aiguille: string) => foin.toLowerCase().includes(aiguille.toLowerCase());

/* ── JS injecté dans le navigateur ─────────────────────────────────────────── */

function jsAccueil(valeurs: string[]): string {
  return `(() => {
  const t = document.body.innerText;
  const marqueurs = ${JSON.stringify(MARQUEURS_ACCUEIL)};
  const interdits = ${JSON.stringify(INTERDITS_ACCUEIL)};
  const valeurs = ${JSON.stringify(valeurs)};
  const probe = (fy) => {
    const el = document.elementFromPoint(Math.round(window.innerWidth / 2), Math.round(window.innerHeight * fy));
    return el ? el.tagName : null;
  };
  return JSON.stringify({
    longueur: t.length,
    marqueursManquants: marqueurs.filter((m) => !t.includes(m)),
    couverture: [0.15, 0.35, 0.55, 0.75].map((f) => probe(f)),
    valeursRendues: valeurs.filter((v) => !t.includes(v)),
    interditsTrouves: interdits.filter((s) => t.toLowerCase().includes(s.toLowerCase())),
    structure: {
      entete: !!document.querySelector("header"),
      principal: !!document.querySelector("main"),
      pied: !!document.querySelector("footer"),
    },
  });
})()`;
}

function jsVue(marqueur: string, interdits: string[], alertes: string[]): string {
  return `(() => {
  const t = document.body.innerText;
  return JSON.stringify({
    longueur: t.length,
    marqueurPresent: t.includes(${JSON.stringify(marqueur)}),
    interditsTrouves: ${JSON.stringify(interdits)}.filter((s) => t.toLowerCase().includes(s.toLowerCase())),
    alertes: ${JSON.stringify(alertes)}.filter((s) => t.toLowerCase().includes(s.toLowerCase())),
  });
})()`;
}

/* ── Vérification d'une vue ───────────────────────────────────────────────── */

function verifierVue(vue: ConfigVue) {
  if (!abOuvrir(vue.url)) {
    ver("navigateur", `vue ${vue.nom} — ouverture`, false, `impossible d'ouvrir ${vue.url}`);
    return;
  }
  const interdits = vue.invisibilite ? INTERDITS_FORTS : [];
  const alertes = vue.invisibilite && vue.alertesContenu ? ALERTES_CONTENU : [];
  const r = abEval(jsVue(vue.marqueur, interdits, alertes));
  if (!r.ok) {
    ver("navigateur", `vue ${vue.nom} — évaluation`, false, r.erreur);
    return;
  }
  const v = r.valeur as unknown as RapportVue;
  ver(
    "navigateur",
    `vue ${vue.nom} — rendu du marqueur protégé`,
    v.marqueurPresent,
    v.marqueurPresent ? `${v.longueur} caractères rendus` : `« ${vue.marqueur} » absent du texte visible`
  );
  if (vue.invisibilite) {
    ver(
      "navigateur",
      `vue ${vue.nom} — invisibilité visiteur`,
      v.interditsTrouves.length === 0,
      v.interditsTrouves.length ? `termes interdits visibles : ${v.interditsTrouves.join(" / ")}` : "aucun terme stratégique visible"
    );
    if (alertes.length > 0 && v.alertes.length > 0) {
      ver(
        "navigateur",
        `vue ${vue.nom} — alertes de contenu`,
        false,
        `à revoir (toléré) : ${v.alertes.join(" / ")}`,
        "alerte"
      );
    }
  }
  const errs = abErreursPage();
  ver(
    "navigateur",
    `vue ${vue.nom} — erreurs de page`,
    errs.nombre === 0,
    errs.nombre === 0 ? "0 erreur" : errs.detail
  );
}

/* ── Programme principal ───────────────────────────────────────────────────── */

async function main() {
  const majBaseline = process.argv.includes("--update-baseline");
  console.log("SENTINELLE ANTI-RÉGRESSION — amens.store");
  console.log(`Cible : ${BASE}${majBaseline ? "  (recapture baseline : OUI)" : ""}\n`);

  /* 1. Qualité : lint */
  try {
    execFileSync("bun", ["run", "lint"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 240_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    ver("qualité", "lint eslint", true, "0 erreur");
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    ver("qualité", "lint eslint", false, String(err.stderr ?? err.message ?? "").slice(0, 400));
  }

  /* 2. Sondes HTTP */
  const html = await httpTexte(BASE + "/");
  const laboR = await httpJson(BASE + "/api/labo");
  const articlesR = await httpJson(BASE + "/api/articles");
  const santeR = await httpJson(BASE + "/api/sante");
  const labo = laboR.data as LaboJson | null;
  const articles = articlesR.data as ArticlesJson | null;

  ver(
    "serveur",
    "GET / (HTML SSR)",
    html.ok && html.texte.length > 10_000,
    html.ok ? `${html.texte.length} caractères` : "serveur dev injoignable — relancer bun run dev en arrière-plan"
  );
  ver("api", "GET /api/labo", laboR.ok, laboR.ok ? "200" : `statut ${laboR.statut}`);
  ver("api", "GET /api/articles", articlesR.ok, articlesR.ok ? "200" : `statut ${articlesR.statut}`);
  ver("api", "GET /api/sante", santeR.ok, santeR.ok ? "200" : `statut ${santeR.statut}`);

  /* 3. Baseline (seuils planchers des fonctionnalités protégées) */
  const hebergeurs = labo ? [...new Set(labo.uptime.map((u) => u.host))].length : 0;
  const compte: Compte = {
    articlesPublies: articles?.articles.length ?? 0,
    hebergeursLabo: hebergeurs,
    lignesUptime: labo?.uptime.length ?? 0,
    lignesLatence: labo?.latence.length ?? 0,
    lignesPrix: labo?.prix.length ?? 0,
  };

  if (majBaseline) {
    mkdirSync(dirname(CHEMIN_BASELINE), { recursive: true });
    writeFileSync(
      CHEMIN_BASELINE,
      JSON.stringify(
        {
          version: 1,
          captureAt: new Date().toISOString(),
          seuils: compte,
          note: "Seuils plancher des fonctionnalités protégées — mise à jour UNIQUEMENT via `bun run baseline:update`, après décision de force majeure documentée dans GUARDRAILS.md.",
        },
        null,
        2
      )
    );
    console.log(`→ Baseline recapturée : ${JSON.stringify(compte)}\n`);
  }

  let baseline: { version?: number; captureAt?: string; seuils?: Compte } | null = null;
  if (existsSync(CHEMIN_BASELINE)) {
    try {
      baseline = JSON.parse(readFileSync(CHEMIN_BASELINE, "utf8"));
    } catch {
      baseline = null;
    }
  }
  if (!baseline?.seuils) {
    ver("baseline", "fichier de baseline", false, "config/regression-baseline.json absent ou illisible — lancer `bun run baseline:update`");
  } else {
    for (const [cle, seuil] of Object.entries(baseline.seuils)) {
      const live = (compte as unknown as Record<string, number>)[cle] ?? 0;
      ver("baseline", `seuil ${cle} ≥ ${seuil}`, live >= Number(seuil), `valeur constatée : ${live}`);
    }
  }

  /* 4. Formes et cohérence des données */
  if (labo) {
    const moyennes = Object.values(labo.kpi.avgUptime);
    const bornes = moyennes.every((m) => m >= 0 && m <= 100);
    ver(
      "api",
      "labo — KPI uptime cohérents",
      moyennes.length >= (baseline?.seuils?.hebergeursLabo ?? 1) && bornes,
      `${moyennes.length} hébergeurs, moyennes ${bornes ? "dans les bornes" : "HORS BORNES"}`
    );
    const latences = Object.values(labo.kpi.latenceAfrique);
    ver(
      "api",
      "labo — latences Afrique renseignées",
      latences.length > 0 && latences.every((l) => l > 0),
      `${latences.length} hébergeurs mesurés`
    );
    ver(
      "api",
      "labo — méthodologie publique",
      (labo.kpi.methodologie ?? "").length > 40,
      `${(labo.kpi.methodologie ?? "").length} caractères`
    );
  }

  if (articles) {
    const tousPublies = articles.articles.every((a) => a.status === "published");
    const champsOk = articles.articles.slice(0, 5).every((a) => a.slug && a.title && a.excerpt && a.content);
    ver(
      "api",
      "articles — uniquement publiés",
      tousPublies,
      tousPublies ? `${articles.articles.length} articles` : "des brouillons fuient dans la liste publique"
    );
    ver("api", "articles — champs complets", champsOk, "slug/titre/extrait/contenu vérifiés sur les 5 premiers");
    ver("api", "articles — silos renseignés", articles.siloCounts.length >= 5, `${articles.siloCounts.length} silos`);
  }

  const sante = santeR.data as { status?: string } | null;
  ver("api", "/api/sante — verdict", sante?.status === "ok", sante?.status ? `status ${sante.status}` : "réponse inattendue");

  /* 5. HTML SSR de l'accueil : vraies valeurs, aucun retour du bug « page vide » */
  const moyennes = labo ? Object.values(labo.kpi.avgUptime) : [];
  const uptimeMoyen = moyennes.length
    ? (moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2)
    : "";
  const latence0 = labo ? String(Math.round(Object.values(labo.kpi.latenceAfrique)[0] ?? 0)) : "";

  if (html.ok) {
    for (const m of MARQUEURS_ACCUEIL) {
      ver("ssr", `marqueur « ${m.slice(0, 34)} »`, html.texte.includes(m), "absent du HTML SSR");
    }
    if (uptimeMoyen) {
      ver(
        "ssr",
        `valeur uptime SSR (${uptimeMoyen} %)`,
        html.texte.includes(`${uptimeMoyen} %`),
        "la vraie valeur n'est pas dans le HTML — retour du bug « haut de page vide »"
      );
    }
    if (latence0) {
      ver("ssr", `valeur latence SSR (${latence0} ms)`, html.texte.includes(`${latence0} ms`), "idem latence");
    }
    ver(
      "ssr",
      `compteur guides SSR (>${compte.articlesPublies}<)`,
      compte.articlesPublies > 0 && html.texte.includes(`>${compte.articlesPublies}<`),
      "compteur non rendu côté serveur"
    );
  }

  /* 5bis. SSR PAR URL — correctif GEO (novembre 2026) : le HTML servi pour
     /?v=article&slug=… doit être celui de l'article (h1, contenu, canonical,
     og:title, JSON-LD Article/FAQPage/Breadcrumb) — les agents IA qui
     n'exécutent pas JavaScript doivent lire l'article réel, pas une page
     d'accueil. Vues blog et blog filtré par silo idem. */
  if (articles?.articles.length) {
    const premier = articles.articles[0];
    const silo0 = premier.silo ?? articles.siloCounts[0]?.silo ?? "";
    const angle0 = ANGLES.find((a) => a.silo === silo0);
    const echapTitre = premier.title.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const rArticle = await httpTexte(BASE + `/?v=article&slug=${encodeURIComponent(premier.slug)}`);
    if (!rArticle.ok) {
      ver("ssr-url", "article — requête", false, "GET de l'URL article en échec");
    } else {
      const t = rArticle.texte;
      ver(
        "ssr-url",
        "article — vue rendue en SSR (h1 DOM)",
        new RegExp(`<h1[^>]*>${echapTitre}`).test(t),
        "le HTML servi n'est pas celui de l'article — régression du SSR par URL (agents IA sans JS)"
      );
      ver(
        "ssr-url",
        "article — hero accueil absent",
        !new RegExp(`<h1[^>]*>Mets en ligne tes projets`).test(t),
        "la vue home fuit dans le HTML de l'URL article"
      );
      ver(
        "ssr-url",
        "article — canonical servi",
        t.includes(`rel="canonical"`) && t.includes(`slug=${encodeURIComponent(premier.slug)}`),
        "pas de <link rel=canonical> pour l'URL article"
      );
      ver(
        "ssr-url",
        "article — og:title servi",
        t.includes(`property="og:title"`),
        "pas de balise og:title dans le head servi"
      );
      const titreDynamique = t.match(/<title>([^<]{0,120})</)?.[1] ?? "";
      ver(
        "ssr-url",
        "article — <title> dédié",
        titreDynamique.length > 0 && !titreDynamique.startsWith("amens.store — mets en ligne"),
        titreDynamique ? `<title>${titreDynamique.slice(0, 50)}</title>` : "aucun <title> servi"
      );
      const ldJson = (t.match(/<script type="application\/ld\+json"[^>]*>[^<]*<\/script>/g) ?? []).join("\n");
      ver(
        "ssr-url",
        "article — JSON-LD Article+FAQPage+BreadcrumbList (DOM)",
        ldJson.includes(`"@type":"Article"`) &&
          ldJson.includes(`"@type":"FAQPage"`) &&
          ldJson.includes(`"@type":"BreadcrumbList"`),
        "JSON-LD de l'article absent du HTML servi (rendu serveur requis)"
      );
    }

    const rBlog = await httpTexte(BASE + "/?v=blog");
    ver(
      "ssr-url",
      "blog — vue rendue en SSR",
      rBlog.ok && new RegExp(`<h1[^>]*>Le blog`).test(rBlog.texte),
      rBlog.ok ? "le HTML servi pour ?v=blog n'est pas celui du blog" : "GET ?v=blog en échec"
    );

    if (silo0) {
      const rSilo = await httpTexte(BASE + `/?v=blog&silo=${encodeURIComponent(silo0)}`);
      const h1Silo = rSilo.texte.match(/<h1[^>]*>([^<]{0,80})/)?.[1] ?? "";
      ver(
        "ssr-url",
        `blog silo (${silo0}) — vue filtrée rendue en SSR`,
        rSilo.ok &&
          h1Silo.length > 0 &&
          !h1Silo.startsWith("Le blog") &&
          !h1Silo.startsWith("Mets en ligne"),
        h1Silo ? `h1 servi : ${h1Silo.slice(0, 40)}` : "aucun h1 rendu"
      );
      if (angle0) {
        ver(
          "ssr-url",
          `blog silo (${silo0}) — en-tête d'angle attendu`,
          rSilo.ok && rSilo.texte.includes(angle0.nom.split("(")[0].slice(0, 30)),
          `« ${angle0.nom.slice(0, 40)} » absent du HTML du silo`
        );
      }
    }
  }

  /* 6. Phase navigateur (agent-browser) */
  console.log("→ Phase navigateur (agent-browser)…");
  const valeurs = [`${uptimeMoyen} %`, `${latence0} ms`].filter((v) => v && !v.startsWith("0 "));

  try {
    ab(["set", "viewport", "1440", "900"]);

    // Accueil desktop — couverture du 4/5 supérieur, hydratation, invisibilité
    if (!abOuvrir("/")) {
      ver("navigateur", "accueil — ouverture", false, "agent-browser n'a pas pu ouvrir /");
    } else {
      const r = abEval(jsAccueil(valeurs));
      if (!r.ok) {
        ver("navigateur", "accueil — évaluation", false, r.erreur);
      } else {
        const v = r.valeur as unknown as RapportAccueil;
        ver(
          "navigateur",
          "accueil — marqueurs visibles",
          v.marqueursManquants.length === 0,
          v.marqueursManquants.length ? `manquants : ${v.marqueursManquants.join(" / ")}` : `${v.longueur} caractères de texte visible`
        );
        ver(
          "navigateur",
          "accueil — couverture du 4/5 supérieur",
          v.couverture.every((c) => c !== null),
          `sondes centrales : ${v.couverture.map((c) => c ?? "VIDE").join(", ")}`
        );
        ver(
          "navigateur",
          "accueil — hydratation (vraies valeurs rendues)",
          v.valeursRendues.length === 0,
          v.valeursRendues.length ? `non rendues : ${v.valeursRendues.join(" / ")}` : `rendues : ${valeurs.join(" / ")}`
        );
        ver(
          "navigateur",
          "accueil — invisibilité visiteur",
          v.interditsTrouves.length === 0,
          v.interditsTrouves.length ? `termes interdits visibles : ${v.interditsTrouves.join(" / ")}` : "aucun terme stratégique visible"
        );
        ver(
          "navigateur",
          "accueil — structure header/main/footer",
          v.structure.entete && v.structure.principal && v.structure.pied,
          JSON.stringify(v.structure)
        );
      }
      const errs = abErreursPage();
      ver("navigateur", "accueil — erreurs de page", errs.nombre === 0, errs.nombre === 0 ? "0 erreur" : errs.detail);
    }

    // Vues statiques
    for (const vue of VUES) verifierVue(vue);

    // Vue article (premier article publié) — marqueur dynamique = son titre
    if (articles?.articles.length) {
      const premier = articles.articles[0];
      const vueArticle: ConfigVue = {
        nom: "article",
        url: `/?v=article&slug=${encodeURIComponent(premier.slug)}`,
        marqueur: premier.title.slice(0, 34),
        invisibilite: true,
        alertesContenu: true,
      };
      verifierVue(vueArticle);
    } else {
      ver("navigateur", "vue article — préparation", false, "aucun article publié dans /api/articles");
    }

    // Mobile 393px — la couverture du haut de page doit tenir aussi en mobile
    ab(["set", "viewport", "393", "844"]);
    if (abOuvrir("/")) {
      const r = abEval(jsAccueil(valeurs));
      if (!r.ok) {
        ver("navigateur", "mobile 393px — évaluation", false, r.erreur);
      } else {
        const v = r.valeur as unknown as RapportAccueil;
        ver(
          "navigateur",
          "mobile 393px — couverture du haut de page",
          v.couverture.every((c) => c !== null) && v.marqueursManquants.length === 0,
          `sondes : ${v.couverture.map((c) => c ?? "VIDE").join(", ")} ; marqueurs manquants : ${v.marqueursManquants.length}`
        );
      }
    } else {
      ver("navigateur", "mobile 393px — ouverture", false, "échec d'ouverture");
    }

    try {
      ab(["close"]);
    } catch {
      /* session déjà fermée : toléré */
    }
  } catch (e) {
    ver("navigateur", "phase navigateur", false, `agent-browser indisponible ou en échec : ${String((e as Error).message).slice(0, 200)}`);
  }

  /* 7. Rapport */
  mkdirSync(dirname(CHEMIN_RAPPORT), { recursive: true });
  const erreurs = verdicts.filter((v) => !v.ok && v.gravite === "erreur");
  const alertes = verdicts.filter((v) => !v.ok && v.gravite === "alerte");
  writeFileSync(
    CHEMIN_RAPPORT,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        baseUrl: BASE,
        resultat: erreurs.length ? "FAIL" : "PASS",
        total: verdicts.length,
        erreurs: erreurs.length,
        alertes: alertes.length,
        verdicts,
      },
      null,
      2
    )
  );

  console.log("");
  for (const v of verdicts) {
    const icone = v.ok ? "✓" : v.gravite === "alerte" ? "!" : "✗";
    console.log(`${icone} [${v.groupe}] ${v.nom}${v.ok ? "" : ` — ${v.detail}`}`);
  }
  console.log("");
  if (erreurs.length) {
    console.log(`RÉSULTAT : FAIL — ${erreurs.length} échec(s) sur ${verdicts.length} contrôles (${alertes.length} alerte(s))`);
    console.log("Rapport complet : config/regression-last-run.json — politique : GUARDRAILS.md");
    process.exit(1);
  }
  console.log(`RÉSULTAT : PASS — ${verdicts.length} contrôles verts (${alertes.length} alerte(s))`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Sentinelle interrompue :", e);
  process.exit(1);
});
