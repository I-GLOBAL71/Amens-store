// pipeline-amens — étape 2 : contrôle du gabarit §4.2 (règles non négociables
// du skill d'orchestration). Vérifie : conclusion 40-60 mots en tête, 8 sections
// imposées, FAQ 5-8 Q/R, disclosure §4.3 mot pour mot, lien affilié canonique
// avec rel="sponsored" + utm_content, maillage vers le pilier + Labo + silo.

import { DISCLOSURE } from "./types";
import { angleById } from "./types";

export interface GabaritCheck {
  passed: boolean;
  issues: { level: "BLOQUANT" | "AVERTISSEMENT"; message: string }[];
  details: string[];
  wordCount: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SECTIONS_REQUISES = [
  "ce qu il te faut",
  "pourquoi ce choix",
  "etape par etape",
  "combien de ram",
  "vrai cout",
  "erreurs frequentes",
  "faq",
  "verdict",
];

export function checkGabarit(
  content: string,
  angle: number
): GabaritCheck {
  const issues: GabaritCheck["issues"] = [];
  const details: string[] = [];
  const lines = content.split("\n");
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // H1 présent
  const h1 = lines.find((l) => /^#\s+/.test(l.trim()));
  if (!h1) {
    issues.push({ level: "BLOQUANT", message: "Aucun H1 — le gabarit §4.2 commence par « # [Titre] — [Bénéfice] »" });
  } else {
    details.push(`H1 : ${h1.replace(/^#\s+/, "").slice(0, 80)}`);
  }

  // Conclusion en tête : premier paragraphe après le H1, 40-60 mots
  let firstPara: string[] = [];
  let seenH1 = false;
  for (const l of lines) {
    const t = l.trim();
    if (/^#\s+/.test(t)) {
      seenH1 = true;
      continue;
    }
    if (seenH1) {
      if (!t || t.startsWith("```") || t.startsWith("|") || t.startsWith(">") || t.startsWith("#")) {
        if (firstPara.length) break;
        continue;
      }
      if (/^<[a-zA-Z]/.test(t) || t.startsWith("<!--")) continue;
      firstPara.push(t);
    }
  }
  const conclusion = firstPara.join(" ");
  const cw = conclusion.split(/\s+/).filter(Boolean).length;
  if (cw < 40) {
    issues.push({
      level: "BLOQUANT",
      message: `Conclusion en tête trop courte (${cw} mots < 40) — le bloc que les IA citent en premier doit faire 40-60 mots`,
    });
  } else if (cw > 70) {
    issues.push({
      level: "BLOQUANT",
      message: `Conclusion en tête trop longue (${cw} mots > 70) — cible 40-60 mots (gabarit §4.2)`,
    });
  } else {
    details.push(`Conclusion en tête calibrée : ${cw} mots ✓`);
  }

  // Les 8 sections §4.2 (match flou sur les H2)
  const h2s = lines.filter((l) => /^##\s+/.test(l.trim())).map((l) => normalize(l.replace(/^##\s+/, "")));
  for (const req of SECTIONS_REQUISES) {
    if (!h2s.some((h) => h.includes(req) || req.includes(h))) {
      issues.push({ level: "BLOQUANT", message: `Section §4.2 manquante : « ${req} » (H2 introuvable)` });
    }
  }
  details.push(`${h2s.length} sections H2 détectées (gabarit : 8 minimum)`);

  // FAQ : 5-8 questions en H3 ou gras
  const faqQuestions = lines.filter((l) => /^###\s+/.test(l.trim())).length;
  if (faqQuestions < 5) {
    issues.push({ level: "BLOQUANT", message: `FAQ trop courte : ${faqQuestions} questions (cible 5-8)` });
  } else if (faqQuestions > 8) {
    issues.push({ level: "AVERTISSEMENT", message: `FAQ longue : ${faqQuestions} questions (cible 5-8)` });
  } else {
    details.push(`FAQ : ${faqQuestions} questions/réponses ✓`);
  }

  // Disclosure §4.3 mot pour mot
  if (!content.includes(DISCLOSURE)) {
    issues.push({ level: "BLOQUANT", message: "Disclosure d'affiliation §4.3 absente (formule exacte requise)" });
  } else {
    details.push("Disclosure §4.3 présente mot pour mot ✓");
  }

  // Lien affilié canonique : rel="sponsored" + utm_content
  const sponsoredOk = /rel="sponsored"[^>]*utm_content=|utm_content=[^>]*"[^"]*"/.test(content) &&
    content.includes('rel="sponsored"');
  if (!sponsoredOk) {
    issues.push({ level: "BLOQUANT", message: 'Lien affilié canonique manquant : <a rel="sponsored" href="…utm_content={slug}"> requis (section 8)' });
  } else {
    details.push('Lien affilié canonique rel="sponsored" + utm_content ✓');
  }

  // Maillage : pilier + Labo + même silo
  const angleDef = angleById(angle);
  const links = [...content.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)].map((m) => m[2]);
  if (angleDef) {
    const pilier = `/${angleDef.silo}/`;
    if (!links.some((l) => l.includes(`/${angleDef.silo}`))) {
      issues.push({ level: "BLOQUANT", message: `Maillage absent : lien vers le pilier ${pilier} requis dans les 2 premiers paragraphes` });
    } else {
      details.push(`Maillage pilier ${pilier} ✓`);
    }
  }
  if (!links.some((l) => l.includes("/labo"))) {
    issues.push({ level: "BLOQUANT", message: "Aucune donnée Labo citée avec lien vers /labo (règle non négociable du pipeline-amens)" });
  } else {
    details.push("Donnée Labo citée avec lien ✓");
  }

  // Tableau chiffré
  if (!content.includes("|")) {
    issues.push({ level: "BLOQUANT", message: "Aucun tableau comparatif chiffré (≥ 1 tableau requis — extraits et cités par les IA)" });
  } else {
    details.push("Tableau chiffré présent ✓");
  }

  if (wordCount < 800) {
    issues.push({ level: "AVERTISSEMENT", message: `Guide court : ${wordCount} mots (cible gabarit 1 500+)` });
  }

  return {
    passed: !issues.some((i) => i.level === "BLOQUANT"),
    issues,
    details,
    wordCount,
  };
}

/** Extrait la FAQ (H3 question + texte réponse) pour le schéma FAQPage. */
export function extractFaq(content: string): { question: string; answer: string }[] {
  const lines = content.split("\n");
  const faq: { question: string; answer: string }[] = [];
  let current: { question: string; answer: string[] } | null = null;
  let inFaqSection = false;
  for (const l of lines) {
    const t = l.trim();
    if (/^##\s+/.test(t)) {
      inFaqSection = normalize(t).includes("faq");
      if (current && current.answer.join(" ").trim()) {
        faq.push({ question: current.question, answer: current.answer.join(" ").trim() });
      }
      current = null;
      continue;
    }
    if (inFaqSection && /^###\s+/.test(t)) {
      if (current && current.answer.join(" ").trim()) {
        faq.push({ question: current.question, answer: current.answer.join(" ").trim() });
      }
      current = { question: t.replace(/^###\s+/, ""), answer: [] };
      continue;
    }
    if (current && t && !t.startsWith("```")) {
      current.answer.push(t);
    }
  }
  if (current && current.answer.join(" ").trim()) {
    faq.push({ question: current.question, answer: current.answer.join(" ").trim() });
  }
  return faq;
}
