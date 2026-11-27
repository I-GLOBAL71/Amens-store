// POST /api/keywords — recherche Blue Ocean temps réel (skill blueocean-keywords :
// autocomplete Google réel → prioriser.py → verdict CIBLER/SURVEILLER/IGNORER)
// GET — liste des requêtes déjà recherchées (filtre par angle/verdict)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rechercherMotsCles } from "@/lib/pipeline/keywords";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const angleParam = searchParams.get("angle");
  const angle = angleParam && Number(angleParam) > 0 ? Number(angleParam) : null;
  const verdict = searchParams.get("verdict");
  const rows = await db.keywordResearch.findMany({
    where: {
      ...(angle ? { angle } : {}),
      ...(verdict ? { verdict } : {}),
    },
    take: 500,
  });
  const verdictRank: Record<string, number> = { CIBLER: 0, SURVEILLER: 1, IGNORER: 2 };
  const volumeRank: Record<string, number> = { "élevée": 0, elevee: 0, moyenne: 1, basse: 2 };
  rows.sort(
    (a, b) =>
      (verdictRank[a.verdict] ?? 9) - (verdictRank[b.verdict] ?? 9) ||
      (volumeRank[a.classeVolume] ?? 9) - (volumeRank[b.classeVolume] ?? 9) ||
      a.difficulte - b.difficulte
  );
  return NextResponse.json({
    rows: rows.slice(0, 300).map((r) => ({
      graine: r.graine,
      requete: r.requete,
      angle: r.angle,
      classeVolume: r.classeVolume,
      difficulte: r.difficulte,
      resistanceAio: r.resistanceAio,
      potentiel: r.potentiel,
      verdict: r.verdict,
      source: r.source,
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.graine !== "string" || !body.graine.trim()) {
    return NextResponse.json(
      { error: "graine requise (ex. « installer n8n », « alternative vercel », « hébergeur orange money »)" },
      { status: 400 }
    );
  }
  const angle = Number(body.angle) || 1;
  const programme = typeof body.programme === "string" ? body.programme : "";

  const result = await rechercherMotsCles(body.graine.trim(), angle, programme);

  // Persistance sans doublon par (requete, angle) pour capitaliser la recherche
  const existingRows = await db.keywordResearch.findMany({
    where: { angle },
    select: { requete: true },
  });
  const existingSet = new Set(existingRows.map((e) => e.requete.toLowerCase()));
  for (const r of result.rows.slice(0, 25)) {
    if (existingSet.has(r.requete.toLowerCase())) continue;
    existingSet.add(r.requete.toLowerCase());
    await db.keywordResearch.create({
      data: {
        graine: body.graine.trim(),
        requete: r.requete,
        angle,
        classeVolume: r.classeVolume,
        difficulte: r.scoreDifficulte,
        resistanceAio: r.resistanceAio,
        potentiel: r.potentiel,
        verdict: r.verdict,
        source: r.source,
      },
    });
  }

  return NextResponse.json({ result });
}
