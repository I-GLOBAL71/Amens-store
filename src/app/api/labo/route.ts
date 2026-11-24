// GET /api/labo — données propriétaires : uptime, latence Afrique,
// prix de renouvellement, suivi citations IA (dashboard /labo/).
import { NextResponse } from "next/server";
import { loadLaboData } from "@/lib/labo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await loadLaboData());
  } catch (e) {
    return NextResponse.json(
      { error: `Données Labo indisponibles : ${e instanceof Error ? e.message : "erreur inconnue"}` },
      { status: 500 }
    );
  }
}
