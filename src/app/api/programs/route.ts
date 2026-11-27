// Programmes d'affiliation (§7.1) — filtres par contexte/geo + tracking URLs
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProgram } from "@/lib/serialize";
import { buildAffiliateUrl } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context");
    const geo = searchParams.get("geo"); // africa → Mobile Money prioritaire
    const angleParam = searchParams.get("angle");
    const slugParam = searchParams.get("slug");
    const articleSlug = searchParams.get("article") ?? "";

    if (slugParam) {
      const p = await db.affiliateProgram.findUnique({ where: { slug: slugParam } });
      if (!p) return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });
      return NextResponse.json({
        program: { ...serializeProgram(p), trackingUrl: buildAffiliateUrl(p.affiliateUrl, articleSlug) },
      });
    }

    const angleNum = angleParam !== null && angleParam !== "" ? Number(angleParam) : null;
    if (angleNum !== null && (!Number.isInteger(angleNum) || angleNum < 1)) {
      return NextResponse.json({ error: "Paramètre angle invalide" }, { status: 400 });
    }

    const programs = await db.affiliateProgram.findMany({
      where: {
        active: true,
        ...(context ? { context } : {}),
        ...(angleNum !== null ? { anglePrincipal: angleNum } : {}),
        ...(geo === "africa" ? { OR: [{ geoTarget: "africa" }, { geoTarget: "global" }] } : {}),
      },
      orderBy: geo === "africa" ? [{ geoTarget: "desc" }, { priorityScore: "desc" }] : { priorityScore: "desc" },
    });

    return NextResponse.json({
      programs: programs.map((p) => ({
        ...serializeProgram(p),
        trackingUrl: buildAffiliateUrl(p.affiliateUrl, articleSlug),
      })),
    });
  } catch (e) {
    console.error("[GET /api/programs]", e);
    return NextResponse.json(
      { error: `Programmes indisponibles : ${e instanceof Error ? e.message : "erreur inconnue"}` },
      { status: 500 }
    );
  }
}
