// Registre des skills enregistrés dans le projet — chargés depuis la DB
// (le pipeline du Studio orchestre ces skills dans l'ordre `ordre`).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeSkill } from "@/lib/serialize";
import { existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const skills = await db.skill.findMany({ orderBy: { ordre: "asc" } });
  const runs = await db.pipelineRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const stepStats: Record<string, { passed: number; warned: number; blocked: number }> = {};
  for (const run of runs) {
    try {
      const steps = JSON.parse(run.stepsJson) as { skillSlug: string; status: string }[];
      for (const s of steps) {
        const st = (stepStats[s.skillSlug] ??= { passed: 0, warned: 0, blocked: 0 });
        if (s.status === "passed") st.passed++;
        else if (s.status === "warned" || s.status === "skipped") st.warned++;
        else st.blocked++;
      }
    } catch {
      // run ancien illisible : ignoré
    }
  }

  return NextResponse.json({
    skills: skills.map((s) => ({
      ...serializeSkill(s),
      installed: existsSync(path.join(process.cwd(), s.skillPath)),
      stats: stepStats[s.slug] ?? { passed: 0, warned: 0, blocked: 0 },
    })),
    pipelinePath: "skills/ (7 skills enregistrés dans le projet)",
  });
}
