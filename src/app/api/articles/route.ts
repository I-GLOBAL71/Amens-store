// API articles — GET (liste filtrable) / POST (création passant OBLIGATOIREMENT
// par le pipeline des skills : publication refusée si une gate échoue).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeArticle, excerptFrom } from "@/lib/serialize";
import { runPipeline, computeSlug, extractFaq } from "@/lib/pipeline/runner";
import { angleById } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const silo = searchParams.get("silo");
  const angle = searchParams.get("angle");
  const q = searchParams.get("q")?.toLowerCase();
  const status = searchParams.get("status") ?? "published";
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const articles = await db.article.findMany({
    where: {
      ...(silo ? { silo } : {}),
      ...(angle ? { angle: Number(angle) } : {}),
      ...(status === "all" ? {} : { status }),
      ...(q
        ? {
            OR: [
              { title: { contains: searchParams.get("q") ?? "" } },
              { content: { contains: searchParams.get("q") ?? "" } },
            ],
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  const siloCounts = await db.article.groupBy({
    by: ["silo"],
    where: { status: "published" },
    _count: { id: true },
  });

  return NextResponse.json({
    articles: articles.map(serializeArticle),
    siloCounts: siloCounts.map((s) => ({ silo: s.silo, count: s._count.id })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || typeof body.title !== "string") {
    return NextResponse.json(
      { error: "Champs requis : title (string), content (markdown §4.2), angle (1-10), requete (string)" },
      { status: 400 }
    );
  }
  const angle = Number(body.angle) || 1;
  if (!angleById(angle)) {
    return NextResponse.json({ error: "angle doit être entre 1 et 10" }, { status: 400 });
  }
  if (!body.requete || typeof body.requete !== "string") {
    return NextResponse.json({ error: "requete (requête cible) requise — le pipeline valide via blueocean-keywords" }, { status: 400 });
  }

  const input = {
    angle,
    requete: body.requete,
    title: body.title,
    content: body.content,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    difficulty: body.difficulty,
    timeEstimate: body.timeEstimate,
    costEstimate: body.costEstimate,
  };

  // Passage OBLIGATOIRE par les skills enregistrés (le pipeline ne publie
  // jamais un contenu non validé par les gates).
  const result = await runPipeline(input);
  const slug = computeSlug(input);
  const faq = extractFaq(result.cleanedContent ?? input.content);
  const angleDef = angleById(angle);

  const primaryProgram =
    body.primaryProgram ??
    (angle === 1
      ? "hostinger-vps"
      : angle === 3
        ? "nindohost"
        : angle === 5
          ? "cloudways"
          : angle === 7
            ? "hostinger-email"
            : angle === 10
              ? "cloudways"
              : angle === 9
                ? "pack-whatsapp"
                : "hostinger-vps");

  const data = {
    slug,
    silo: angleDef ? angleDef.silo : "blog",
    angle,
    title: input.title,
    metaTitle: input.metaTitle ?? input.title,
    metaDescription:
      input.metaDescription ??
      `${input.title} : guide testé, prix réels et commandes copiables sur amens.store.`,
    excerpt: excerptFrom(result.cleanedContent ?? input.content),
    content: result.cleanedContent ?? input.content,
    faqJson: JSON.stringify(faq),
    primaryProgram,
    difficulty: input.difficulty ?? "débutant",
    timeEstimate: input.timeEstimate ?? "",
    costEstimate: input.costEstimate ?? "",
    status: result.canPublish ? "published" : "draft",
    seoScore: result.steps.find((s) => s.skillSlug === "seo-ultra")?.score ?? 0,
    geoScore: result.steps.find((s) => s.skillSlug === "geo-citations-ia")?.score ?? 0,
    humanScore: result.steps.find((s) => s.skillSlug === "humanisation-100")?.score ?? 0,
    verificationPassed:
      (result.steps.find((s) => s.skillSlug === "verification-contenu")?.status ?? "blocked") === "passed",
    publishedAt: result.canPublish ? new Date() : null,
  };

  const article = await db.article.upsert({
    where: { slug },
    update: data,
    create: { ...data, author: body.author ?? "equipe-amens" },
  });

  const run = await db.pipelineRun.create({
    data: {
      runType: "publish",
      status: result.status === "passed" ? "passed" : "blocked",
      angle,
      requete: input.requete,
      title: input.title,
      slug,
      stepsJson: JSON.stringify(result.steps),
      blockingIssues: result.blockingIssues,
      warnings: result.warnings,
      overallScore: result.overallScore,
      articleId: article.id,
    },
  });

  return NextResponse.json(
    {
      article: serializeArticle(article),
      pipeline: result,
      runId: run.id,
      message: result.canPublish
        ? "Article publié : toutes les gates des skills sont passées (relecture humaine recommandée avant diffusion)."
        : "Article enregistré en BROUILLON : le pipeline des skills a détecté des bloquants — publication refusée. Corrige puis relance.",
    },
    { status: result.canPublish ? 201 : 409 }
  );
}
