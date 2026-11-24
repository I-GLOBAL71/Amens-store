// POST /api/pipeline — analyse un contenu à travers les 7 skills
// (sans enregistrement) : retourne le rapport complet des gates.
import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline/runner";
import { db } from "@/lib/db";
import { angleById } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || typeof body.title !== "string") {
    return NextResponse.json(
      { error: "Champs requis : title, content, angle (1-10), requete" },
      { status: 400 }
    );
  }
  const angle = Number(body.angle) || 1;
  if (!angleById(angle)) {
    return NextResponse.json({ error: "angle doit être entre 1 et 10" }, { status: 400 });
  }
  if (!body.requete || typeof body.requete !== "string") {
    return NextResponse.json(
      { error: "requete (requête cible) requise — validée par le skill blueocean-keywords" },
      { status: 400 }
    );
  }

  const result = await runPipeline({
    angle,
    requete: body.requete,
    title: body.title,
    content: body.content,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
  });

  await db.pipelineRun.create({
    data: {
      runType: "analyze",
      status: result.status === "passed" ? "passed" : "blocked",
      angle,
      requete: body.requete,
      title: body.title,
      stepsJson: JSON.stringify(result.steps),
      blockingIssues: result.blockingIssues,
      warnings: result.warnings,
      overallScore: result.overallScore,
    },
  });

  return NextResponse.json({ pipeline: result });
}
