// blueocean-keywords — recherche de mots-clés à fort trafic / faible concurrence.
// Exécute les VRAIS scripts du skill : suggest.py (autocomplete Google réel,
// endpoint public, sans clé API) puis prioriser.py (scoring proxy KD + filtre
// cahier des charges ≥ 2 conditions sur 3). Fallback documenté : expansion
// locale par modifiers (référence modifiers-fr.md du skill) quand le réseau
// échoue — jamais de volume inventé, uniquement des classes.

import { runPy, SCRIPTS, writeTmp } from "./py";
import type { KeywordRow } from "./types";

// Bibliothèque de modifiers FR (issue de skills/blueocean-keywords/references/modifiers-fr.md)
const MODIFIERS_PAR_ANGLE: Record<number, string[]> = {
  1: [
    "installer n8n sur vps",
    "auto-héberger ollama",
    "installer open webui hébergement",
    "installer coolify vps",
    "n8n cloud vs auto-hébergé coût",
    "combien de ram pour n8n",
    "ollama hébergement",
    "quitter zapier alternative",
    "dify auto-hébergé",
    "n8n docker serveur",
  ],
  2: [
    "mettre en ligne mon app lovable",
    "déployer bolt sur vps",
    "quitter vercel sans tout casser",
    "supabase auto-hébergé",
    "déployer v0 sur vps",
    "cursor app déployer",
    "vercel trop cher",
    "alternative vercel",
    "coût app production lovable",
    "lovable nom de domaine",
  ],
  3: [
    "hébergeur qui accepte orange money",
    "hébergeur mobile money",
    "acheter nom de domaine sans carte bancaire",
    "prix site web cameroun fcfa",
    "nom de domaine .cm prix",
    "nom de domaine .ci démarches",
    "hébergeur côte d'ivoire mobile money",
    "payer hostinger sans carte",
    "créer carte virtuelle cameroun",
    "hébergeur sénégal wave",
    "site web abidjan prix",
    "domaine .sn prix",
  ],
  4: [
    "qui héberge ce site",
    "prix renouvellement hébergement",
    "hébergeur renouvellement cher",
    "hostinger down",
    "vérifier dns site",
    "vérifier ssl site",
    "générateur nom de domaine",
    "mon site est en panne",
  ],
  5: [
    "bluehost renouvellement trop cher",
    "annuler hostinger",
    "alternative à o2switch",
    "quitter wix",
    "migrer ionos vers autre hébergeur",
    "hostinger augmentation prix",
    "quitter ovh",
    "migration site wordpress gratuite",
    "alternative godaddy",
    "quitter vercel",
  ],
  6: [
    "black friday hébergement 2026",
    "code promo hostinger",
    "cyber monday hébergement",
    "meilleure offre vps black friday",
    "code promo o2switch",
    "réduction hébergeur black friday",
    "code promo contabo",
  ],
  7: [
    "créer adresse email professionnelle",
    "email pro avec nom de domaine",
    "hostinger email vs zoho mail",
    "alternative google workspace",
    "email pro pas cher",
    "email pro gratuit",
    "configurer spf dkim dmarc",
    "configurer email pro outlook",
    "migrer gmail vers email pro",
    "email pro pour freelance",
  ],
  8: [
    "ovh en panne",
    "hostinger down",
    "o2switch panne",
    "cloudflare statut incident",
    "ionos down",
    "vercel down",
    "comment savoir si mon site est en panne",
    "aws panne aujourd'hui",
  ],
  9: [
    "site web école cameroun",
    "site web église",
    "site ong association",
    "site web restaurant prix",
    "site portfolio photographe",
    "site web avocat prix",
    "créer site freelance",
    "site web médecin",
    "prix site web abidjan",
    "site boutique en ligne fcfa",
  ],
  10: [
    "hébergement pour agence web",
    "hébergement multi-sites wordpress",
    "cloudways vs kinsta",
    "hébergement client agence",
    "marge agence hébergement",
    "hébergement white label",
    "facturer hébergement client",
    "meilleur hébergement freelance",
    "hébergement revendeur",
  ],
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

export interface KeywordResearchResult {
  source: "autocomplete" | "expansion-locale";
  rows: KeywordRow[];
  cibler: number;
  surveiller: number;
  ignorer: number;
  note: string;
}

async function runPrioriser(
  entreeJson: string,
  angle: number,
  programme: string,
  source: "autocomplete" | "expansion-locale"
): Promise<KeywordResearchResult | null> {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  const inFile = await writeTmp(`kw-in-${stamp}.json`, entreeJson);
  const outFile = (await import("path")).join(
    (await import("./py")).TMP_DIR,
    `kw-out-${stamp}.csv`
  );
  const res = await runPy(SCRIPTS.blueoceanPrioriser, [
    "--entree", inFile, "--angle", String(angle), "--programme", programme,
    "--sortie", outFile,
  ]);
  if (res.code !== 0 && !res.stdout.includes("CIBLER")) {
    return null;
  }
  const { readTmp } = await import("./py");
  const csv = await readTmp(`kw-out-${stamp}.csv`);
  if (!csv) return null;
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return null;
  const header = parseCsvLine(lines[0]);
  const rows: KeywordRow[] = lines.slice(1).map((l) => {
    const f = parseCsvLine(l);
    const get = (col: string) => f[header.indexOf(col)] ?? "";
    return {
      requete: get("requete"),
      longueurMots: Number(get("longueur_mots")) || 0,
      paysDetectes: get("pays_detectes"),
      nbVariantes: Number(get("nb_variantes")) || 1,
      classeVolume: get("classes_volume"),
      scoreDifficulte: Number(get("score_difficulte")) || 55,
      resistanceAio: get("resistance_aio"),
      potentiel: get("potentiel_affiliation"),
      verdict: get("verdict"),
      source,
    };
  });
  const m = res.stdout.match(/CIBLER\s*:\s*(\d+).*SURVEILLER\s*:\s*(\d+).*IGNORER\s*:\s*(\d+)/s);
  return {
    source,
    rows,
    cibler: m ? Number(m[1]) : rows.filter((r) => r.verdict === "CIBLER").length,
    surveiller: m ? Number(m[2]) : rows.filter((r) => r.verdict === "SURVEILLER").length,
    ignorer: m ? Number(m[3]) : rows.filter((r) => r.verdict === "IGNORER").length,
    note: "",
  };
}

/**
 * Recherche Blue Ocean pour une graine + angle.
 * 1. Tente l'autocomplete Google réel (suggest.py, endpoint public, sans clé).
 * 2. En cas d'échec réseau : expansion locale via les modifiers documentés
 *    (format d'entrée manuel du skill — aucune donnée inventée).
 */
export async function rechercherMotsCles(
  graine: string,
  angle: number,
  programme = ""
): Promise<KeywordResearchResult> {
  // 1. Autocomplete réel
  const stamp = Date.now();
  const outFile = `kw-suggest-${stamp}.json`;
  const path = (await import("path")).join(
    (await import("./py")).TMP_DIR,
    outFile
  );
  const res = await runPy(SCRIPTS.blueoceanSuggest, [
    "--graine", graine,
    "--hl", "fr",
    "--pays", "fr,ci,cm,sn",
    "--profondeur", "1",
    "--sortie", path,
  ], 20000);
  if (res.code === 0) {
    const { readTmp } = await import("./py");
    const raw = await readTmp(outFile);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          const parsed = await runPrioriser(
            JSON.stringify(data),
            angle,
            programme,
            "autocomplete"
          );
          if (parsed) {
            return {
              ...parsed,
              note:
                "Données autocomplete Google réelles (endpoint public suggestqueries, relevé à l'instant). Volumes = classes d'ordre de grandeur, à valider GSC/Semrush.",
            };
          }
        }
      } catch {
        // JSON invalide → fallback
      }
    }
  }

  // 2. Fallback documenté : expansion locale par modifiers
  // (format dict {"manuel": [...]} attendu par prioriser.py)
  const modifiers = MODIFIERS_PAR_ANGLE[angle] ?? MODIFIERS_PAR_ANGLE[1];
  const graines = [
    graine,
    ...modifiers.filter((m) => m.includes(graine.split(" ")[0].toLowerCase())),
  ].slice(0, 8);
  const entree = graines.map((g) => ({
    graine: g,
    hl: "fr",
    gl: "fr",
    source: "expansion-locale",
    suggestions: {
      manuel: [
        g,
        ...modifiers.slice(0, 4).map((m) => `${g} ${m.split(" ").slice(-2).join(" ")}`),
      ],
    },
    collecte_le: new Date().toISOString(),
  }));
  const parsed = await runPrioriser(
    JSON.stringify(entree),
    angle,
    programme,
    "expansion-locale"
  );
  if (parsed) {
    return {
      ...parsed,
      note:
        "Endpoint autocomplete inaccessible : expansion locale par modifiers (référence modifiers-fr.md du skill blueocean-keywords). Volumes = classes uniquement, aucun chiffre inventé.",
    };
  }
  return {
    source: "expansion-locale",
    rows: [],
    cibler: 0,
    surveiller: 0,
    ignorer: 0,
    note:
      "Endpoint autocomplete inaccessible et scoring indisponible — collecter les suggestions manuellement depuis un navigateur puis relancer (format-entree.md du skill).",
  };
}

/** Valide UNE requête cible (gate 1 du pipeline) via prioriser.py. */
export async function validerRequete(
  requete: string,
  angle: number,
  programme = ""
): Promise<KeywordRow | null> {
  const entree = [
    {
      graine: requete,
      hl: "fr",
      gl: "fr",
      source: "manuel",
      suggestions: { manuel: [requete] },
      collecte_le: new Date().toISOString(),
    },
  ];
  const parsed = await runPrioriser(
    JSON.stringify(entree),
    angle,
    programme,
    "expansion-locale"
  );
  if (!parsed || parsed.rows.length === 0) return null;
  return parsed.rows.find((r) => r.requete === requete.toLowerCase()) ?? parsed.rows[0];
}
