// Programmes d'affiliation (§7.1) — filtres par contexte/geo + tracking URLs
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProgram } from "@/lib/serialize";
import { buildAffiliateUrl } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const context = searchParams.get("context");
  const geo = searchParams.get("geo"); // africa → Mobile Money prioritaire
  const angle = searchParams.get("angle");
  const slugParam = searchParams.get("slug");

  if (slugParam) {
    const p = await db.affiliateProgram.findUnique({ where: { slug: slugParam } });
    if (!p) return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });
    return NextResponse.json({
      program: { ...serializeProgram(p), trackingUrl: buildAffiliateUrl(p.affiliateUrl, searchParams.get("article") ?? "") },
    });
  }

  const programs = await db.affiliateProgram.findMany({
    where: {
      active: true,
      ...(context ? { context } : {}),
      ...(angle ? { anglePrincipal: Number(angle) } : {}),
      ...(geo === "africa" ? { OR: [{ geoTarget: "africa" }, { geoTarget: "global" }] } : {}),
    },
    orderBy: geo === "africa" ? [{ geoTarget: "desc" }, { priorityScore: "desc" }] : { priorityScore: "desc" },
  });

  return NextResponse.json({
    programs: programs.map((p) => ({
      ...serializeProgram(p),
      trackingUrl: buildAffiliateUrl(p.affiliateUrl, searchParams.get("article") ?? ""),
    })),
  });
}
