// POST /api/leads — newsletter « Deals hébergement » + packs WhatsApp (angle 3/9)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.contact !== "string" || !body.contact.trim()) {
    return NextResponse.json({ error: "contact (email ou WhatsApp) requis" }, { status: 400 });
  }
  const type = body.type === "whatsapp" ? "whatsapp" : "newsletter";
  const contact = body.contact.trim().slice(0, 120);
  if (type === "newsletter" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    return NextResponse.json({ error: "email invalide" }, { status: 400 });
  }
  const lead = await db.lead.create({
    data: {
      type,
      contact,
      angle: Number(body.angle) || 0,
      message: typeof body.message === "string" ? body.message.slice(0, 500) : "",
    },
  });
  return NextResponse.json({
    ok: true,
    id: lead.id,
    message:
      type === "whatsapp"
        ? "Demande enregistrée — l'équipe te contacte sur WhatsApp (paiement Mobile Money accepté)."
        : "Inscrit à la newsletter Deals hébergement — tu recevras les vraies remises (renouvellements inclus).",
  });
}
