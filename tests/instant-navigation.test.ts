import { describe, expect, it } from "bun:test";
import {
  buildCachedArticleDetail,
  filterCachedArticlesBySilo,
  filterCachedPrograms,
} from "../src/lib/cache-helpers";
import { loadArticleDetail } from "../src/lib/article-data";
import { db } from "../src/lib/db";
import type { ArticleDTO, InitialArticlesPayload, ProgramDTO } from "../src/lib/pipeline/types";

const makeArticle = (overrides: Partial<ArticleDTO>): ArticleDTO => ({
  id: "id-1",
  slug: "ia-automatisation/n8n/hostinger",
  silo: "ia-automatisation",
  angle: 1,
  title: "Installer n8n sur Hostinger",
  metaTitle: "Installer n8n",
  metaDescription: "Guide n8n",
  excerpt: "Extrait",
  content: "# Titre\n\nContenu",
  faq: [],
  primaryProgram: "hostinger-vps",
  secondaryPrograms: [],
  difficulty: "débutant",
  timeEstimate: "10 min",
  costEstimate: "5,99 €/mois",
  status: "published",
  seoScore: 95,
  geoScore: 95,
  humanScore: 95,
  verificationPassed: true,
  laboData: [],
  author: "equipe-amens",
  views: 10,
  publishedAt: "2026-11-20T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
  ...overrides,
});

const makeProgram = (overrides: Partial<ProgramDTO>): ProgramDTO => ({
  id: "prog-1",
  slug: "hostinger-vps",
  name: "Hostinger VPS",
  commissionType: "CPA",
  commissionValue: "60%",
  cookieDays: 30,
  payoutThreshold: "50 €",
  affiliateUrl: "https://example.com/hostinger",
  geoTarget: "global",
  context: "vps_ia",
  priorityScore: 90,
  anglePrincipal: 1,
  active: true,
  ...overrides,
});

describe("Ouverture instantanée depuis le cache client", () => {
  const articles: ArticleDTO[] = [
    makeArticle({ id: "1", slug: "ia-automatisation/n8n", silo: "ia-automatisation", views: 50 }),
    makeArticle({ id: "2", slug: "ia-automatisation/ollama", silo: "ia-automatisation", views: 20 }),
    makeArticle({ id: "3", slug: "afrique/orange-money", silo: "afrique", angle: 3, primaryProgram: "nindohost", views: 40 }),
  ];

  const programs: ProgramDTO[] = [
    makeProgram({ id: "p1", slug: "hostinger-vps", context: "vps_ia", priorityScore: 95, geoTarget: "global" }),
    makeProgram({ id: "p2", slug: "contabo-vps", context: "vps_ia", priorityScore: 80, geoTarget: "global" }),
    makeProgram({ id: "p3", slug: "nindohost", context: "mutualise", priorityScore: 70, geoTarget: "africa" }),
  ];

  it("filtre instantanément les articles par silo sans requête réseau", () => {
    const payload: InitialArticlesPayload = {
      articles,
      siloCounts: [
        { silo: "ia-automatisation", count: 2 },
        { silo: "afrique", count: 1 },
      ],
    };
    const filtered = filterCachedArticlesBySilo(payload, "ia-automatisation");
    expect(filtered?.articles.length).toBe(2);
    expect(filtered?.articles.every((a) => a.silo === "ia-automatisation")).toBe(true);
    expect(filterCachedArticlesBySilo(payload, null)?.articles.length).toBe(3);
  });

  it("filtre et priorise les programmes Afrique comme l'API /api/programs", () => {
    const africa = filterCachedPrograms(programs, { geo: "africa" });
    expect(africa?.programs[0].slug).toBe("nindohost");
    expect(africa?.programs[0].trackingUrl).toContain("utm_source=amens");

    const vps = filterCachedPrograms(programs, { context: "vps_ia" });
    expect(vps?.programs.map((p) => p.slug)).toEqual(["hostinger-vps", "contabo-vps"]);
  });

  it("construit immédiatement le détail d'un article avec maillage et affiliation UTM", () => {
    const detail = buildCachedArticleDetail("ia-automatisation/n8n", articles, programs);
    expect(detail).toBeDefined();
    expect(detail?.article.slug).toBe("ia-automatisation/n8n");
    expect(detail?.primaryProgram?.slug).toBe("hostinger-vps");
    expect(detail?.primaryProgram?.trackingUrl).toContain("utm_source=amens");
    expect(detail?.alternatives.map((a) => a.slug)).toEqual(["contabo-vps"]);
    expect(detail?.maillage.silo.map((a) => a.slug)).toEqual(["ia-automatisation/ollama"]);
    expect(detail?.maillage.inter.map((a) => a.slug)).toEqual(["afrique/orange-money"]);
  });

  it("loadArticleDetail (SSR & API parallélisés) renvoie un payload complet valide", async () => {
    const first = await db.article.findFirst({ where: { status: "published" }, select: { slug: true } });
    expect(first).toBeTruthy();
    const detail = await loadArticleDetail(first!.slug, { incrementViews: false });
    expect(detail).not.toBeNull();
    expect(detail?.article.slug).toBe(first!.slug);
    expect(Array.isArray(detail?.maillage.silo)).toBe(true);
    expect(Array.isArray(detail?.maillage.inter)).toBe(true);
  });
});
