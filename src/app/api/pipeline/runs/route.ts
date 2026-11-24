// GET /api/pipeline/runs — historique des exécutions du pipeline (traçabilité)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const runs = await db.pipelineRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      runType: r.runType,
      status: r.status,
      angle: r.angle,
      requete: r.requete,
      title: r.title,
      slug: r.slug,
      blockingIssues: r.blockingIssues,
      warnings: r.warnings,
      overallScore: r.overallScore,
      steps: (() => {
        try {
          return (JSON.parse(r.stepsJson) as { skillSlug: string; status: string; score?: number; summary: string }[]).map(
            (s) => ({ skillSlug: s.skillSlug, status: s.status, score: s.score, summary: s.summary })
          );
        } catch {
          return [];
        }
      })(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
