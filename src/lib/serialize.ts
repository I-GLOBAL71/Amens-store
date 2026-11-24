// Sérialisation DB → DTO pour les API amens.store
import type { Article, AffiliateProgram, Skill } from "@prisma/client";
import type { ArticleDTO, ProgramDTO, SkillDTO, FaqItem } from "./pipeline/types";

function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function serializeArticle(a: Article): ArticleDTO {
  return {
    id: a.id,
    slug: a.slug,
    silo: a.silo,
    angle: a.angle,
    title: a.title,
    metaTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    excerpt: a.excerpt,
    content: a.content,
    faq: safeJson<FaqItem[]>(a.faqJson, []),
    primaryProgram: a.primaryProgram,
    secondaryPrograms: safeJson<string[]>(a.secondaryProgramsJson, []),
    difficulty: a.difficulty,
    timeEstimate: a.timeEstimate,
    costEstimate: a.costEstimate,
    status: a.status,
    seoScore: a.seoScore,
    geoScore: a.geoScore,
    humanScore: a.humanScore,
    verificationPassed: a.verificationPassed,
    laboData: safeJson<string[]>(a.laboDataJson, []),
    author: a.author,
    views: a.views,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function serializeProgram(p: AffiliateProgram): ProgramDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    commissionType: p.commissionType,
    commissionValue: p.commissionValue,
    cookieDays: p.cookieDays,
    payoutThreshold: p.payoutThreshold,
    affiliateUrl: p.affiliateUrl,
    geoTarget: p.geoTarget,
    context: p.context,
    priorityScore: p.priorityScore,
    anglePrincipal: p.anglePrincipal,
    active: p.active,
  };
}

export function serializeSkill(s: Skill): SkillDTO {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    role: s.role,
    mission: s.mission,
    description: s.description,
    version: s.version,
    ordre: s.ordre,
    gate: s.gate,
    active: s.active,
    skillPath: s.skillPath,
    scriptPath: s.scriptPath,
    reference: s.reference,
  };
}

export function excerptFrom(content: string, max = 220): string {
  const first = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("---") && !l.startsWith("```") && !l.startsWith("|") && !l.startsWith("<") && !l.startsWith(">") && !l.startsWith("<!--"))
    .slice(0, 2)
    .join(" ");
  if (first.length <= max) return first;
  // Coupe propre : on ne colle pas « … » après une ponctuation finale,
  // sinon l'extrait affiche « …tat…. » ou « ne casse rien…. ».
  const coupe = first.slice(0, max - 1).replace(/[\s,;:.…!?\u2026]+$/, "");
  return coupe + "…";
}
