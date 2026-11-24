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
  const angle = searchParams.get("angle");
  const verdict = searchParams.get("verdict");
  const rows = await db.keywordResearch.findMany({
    where: {
      ...(angle ? { angle: Number(angle) } : {}),
      ...(verdict ? { verdict } : {}),
    },
    orderBy: [{ verdict: "asc" }, { difficulte: "asc" }],
    take: 300,
  });
  return NextResponse.json({
    rows: rows.map((r) => ({
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
    return NextResponse.json({ error: "graine requise (ex. « hébergeur cameroun »)" }, { status: 400 });
  }
  const angle = Number(body.angle) || 1;
  const programme = typeof body.programme === "string" ? body.programme : "";

  const result = await rechercherMotsCles(body.graine.trim(), angle, programme);

  // Persistance pour capitaliser la recherche
  const existing = await db.keywordResearch.findFirst({
    where: { graine: body.graine.trim(), angle },
  });
  if (!existing) {
    for (const r of result.rows.slice(0, 25)) {
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
  }

  return NextResponse.json({ result });
}
