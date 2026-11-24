// Types partagés du pipeline éditorial amens.store
// Chaque contenu futur passe obligatoirement par les skills enregistrés.

export type ViewName =
  | "home"
  | "blog"
  | "article"
  | "studio"
  | "labo"
  | "outils"
  | "promos";

export interface StepIssue {
  level: "BLOQUANT" | "AVERTISSEMENT" | "INFO";
  message: string;
}

export interface PipelineStepResult {
  skillSlug: string;
  skillName: string;
  ordre: number;
  gate: boolean;
  status: "passed" | "warned" | "blocked" | "error" | "skipped";
  score?: number; // 0-100 quand applicable
  summary: string;
  issues: StepIssue[];
  details?: string[];
  durationMs: number;
}

export interface PipelineResult {
  status: "passed" | "blocked" | "error";
  blockingIssues: number;
  warnings: number;
  overallScore: number; // moyenne pondérée des scores
  verdict: string;
  steps: PipelineStepResult[];
  cleanedContent?: string; // contenu après suppression des traces IA
  canPublish: boolean;
}

export interface PipelineInput {
  angle: number;
  requete: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  difficulty?: string;
  timeEstimate?: string;
  costEstimate?: string;
}

// Article sérialisé côté API
export interface ArticleDTO {
  id: string;
  slug: string;
  silo: string;
  angle: number;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  faq: FaqItem[];
  primaryProgram: string;
  secondaryPrograms: string[];
  difficulty: string;
  timeEstimate: string;
  costEstimate: string;
  status: string;
  seoScore: number;
  geoScore: number;
  humanScore: number;
  verificationPassed: boolean;
  laboData: string[];
  author: string;
  views: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProgramDTO {
  id: string;
  slug: string;
  name: string;
  commissionType: string;
  commissionValue: string;
  cookieDays: number;
  payoutThreshold: string;
  affiliateUrl: string;
  geoTarget: string;
  context: string;
  priorityScore: number;
  anglePrincipal: number;
  active: boolean;
}

// Payload détaillé d'un article (partagé entre /api/articles/[...slug] et
// l'injection SSR de la route / — les deux producteurs DOIVENT rester
// strictement alignés sur cette forme).
export interface ArticleDetailPayload {
  article: ArticleDTO;
  primaryProgram: (ProgramDTO & { trackingUrl: string }) | null;
  alternatives: (ProgramDTO & { trackingUrl: string })[];
  maillage: { silo: ArticleDTO[]; inter: ArticleDTO[] };
}

export interface SkillDTO {
  id: string;
  slug: string;
  name: string;
  role: string;
  mission: string;
  description: string;
  version: string;
  ordre: number;
  gate: boolean;
  active: boolean;
  skillPath: string;
  scriptPath: string;
  reference: string;
}

export interface KeywordRow {
  requete: string;
  longueurMots: number;
  paysDetectes: string;
  nbVariantes: number;
  classeVolume: string;
  scoreDifficulte: number;
  resistanceAio: string;
  potentiel: string;
  verdict: string;
  source: string;
}

export interface LaboData {
  uptime: { host: string; region: string; uptime: number; incidents30j: number; lastCheckAt: string }[];
  latence: { host: string; region: string; latenceMs: number; period: string }[];
  prix: { host: string; plan: string; prixPromo: number; prixRenouvellement: number; devise: string; captureAt: string }[];
  citations: { plateforme: string; requete: string; cite: boolean; checkedAt: string }[];
}

/* LaboData + agrégats KPI (uptime moyen, citation rate, latence Afrique) —
   forme exacte renvoyée par GET /api/labo et par le chargement SSR de la page. */
export interface LaboKpi {
  citationRate: number;
  citationRateDetail: string;
  cibleMois3: number;
  cibleMois6: number;
  avgUptime: Record<string, number>;
  latenceAfrique: Record<string, number>;
  methodologie: string;
}
export type LaboFull = LaboData & { kpi: LaboKpi };

/* Charge initial serveur pour la page d'accueil : liste d'articles publiés
   + compteurs par silo (injecté dans le cache TanStack Query au 1er rendu). */
export interface InitialArticlesPayload {
  articles: ArticleDTO[];
  siloCounts: { silo: string; count: number }[];
}

export interface AngleDef {
  id: number;
  nom: string;
  pilier: string;
  silo: string;
  description: string;
  cta: string;
  couleur: string;
  icone: string;
}

export const ANGLES: AngleDef[] = [
  {
    id: 1,
    nom: "Auto-hébergement IA & automatisation",
    pilier: "P1",
    silo: "ia-automatisation",
    description:
      "n8n, Ollama, Open WebUI, Coolify… Tutoriels pas à pas, testés sur VPS, pour auto-héberger ton IA et tes automatisations.",
    cta: "Créer mon VPS",
    couleur: "emerald",
    icone: "cpu",
  },
  {
    id: 2,
    nom: "Vibe coding (déployer une app IA)",
    pilier: "P2",
    silo: "deployer-mon-app",
    description:
      "Lovable, Bolt, v0, Cursor… Tu as codé ton app avec une IA, maintenant mets-la en ligne sans exploser ta facture Vercel.",
    cta: "Créer mon VPS",
    couleur: "amber",
    icone: "rocket",
  },
  {
    id: 3,
    nom: "Afrique francophone sans carte bancaire",
    pilier: "P3",
    silo: "afrique",
    description:
      "Orange Money, MTN MoMo, Wave, FCFA, .cm/.ci/.sn. Héberger et acheter un domaine sans carte bancaire, de bout en bout.",
    cta: "Payer en Mobile Money",
    couleur: "orange",
    icone: "globe",
  },
  {
    id: 4,
    nom: "Outils et calculateurs gratuits",
    pilier: "Transverse",
    silo: "outils",
    description:
      "Vrai coût sur 3 ans, panne DNS/SSL, qui héberge un site : des calculateurs et vérificateurs gratuits, résultats instantanés.",
    cta: "Obtiens le même hébergeur −20 %",
    couleur: "teal",
    icone: "wrench",
  },
  {
    id: 5,
    nom: "Migrer ou résilier sans frais",
    pilier: "Transverse",
    silo: "migrer",
    description:
      "« Renouvellement trop cher », « annuler », « alternative à… » : guides pour changer d'hébergeur sans coupure et sans frais cachés.",
    cta: "Migrer gratuitement",
    couleur: "rose",
    icone: "arrow-right-left",
  },
  {
    id: 6,
    nom: "Black Friday & codes promo datés",
    pilier: "Saisonnier",
    silo: "promos",
    description:
      "Les vraies remises, renouvellements inclus, heure par heure. Pic annuel des ventes d'hébergement.",
    cta: "Code Black Friday",
    couleur: "red",
    icone: "tag",
  },
  {
    id: 7,
    nom: "Email professionnel",
    pilier: "P4",
    silo: "email-pro",
    description:
      "Créer une adresse pro avec ton nom de domaine, SPF/DKIM/DMARC, comparatifs chiffrés.",
    cta: "Créer mon email pro",
    couleur: "cyan",
    icone: "mail",
  },
  {
    id: 8,
    nom: "Pannes en temps réel",
    pilier: "Transverse",
    silo: "pannes",
    description:
      "État temps réel des hébergeurs, historique d'incidents, alternatives immédiates quand [hébergeur] est down.",
    cta: "Alternative immédiate",
    couleur: "yellow",
    icone: "activity",
  },
  {
    id: 9,
    nom: "Hébergement par métier / vertical",
    pilier: "P5",
    silo: "metiers",
    description:
      "Écoles, églises, ONG, restaurants, avocats, photographes : guides par métier + packs WhatsApp clé en main.",
    cta: "Pack clé en main WhatsApp",
    couleur: "violet",
    icone: "briefcase",
  },
  {
    id: 10,
    nom: "Agences et freelances B2B",
    pilier: "P6",
    silo: "agences",
    description:
      "Multi-sites, white-label, calculateur de marge : héberge les sites de tes clients en gardant ta rentabilité.",
    cta: "Calculer ma marge agence",
    couleur: "slate",
    icone: "building",
  },
];

export function angleById(id: number): AngleDef | undefined {
  return ANGLES.find((a) => a.id === id);
}

export const DISCLOSURE =
  "Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.";

export function buildAffiliateUrl(affiliateUrl: string, slug: string): string {
  const sep = affiliateUrl.includes("?") ? "&" : "?";
  return `${affiliateUrl}${sep}utm_source=amens&utm_medium=affiliate&utm_content=${encodeURIComponent(slug)}`;
}
