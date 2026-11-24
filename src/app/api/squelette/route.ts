// POST /api/squelette — génère le squelette d'article via le VRAI script
// du skill pipeline-amens (nouvel_article.py) : gabarit §4.2, frontmatter,
// disclosure, blocs d'injection d'affiliation et checklist de la gate.
import { NextResponse } from "next/server";
import path from "path";
import { runPy, SCRIPTS, TMP_DIR, ensureTmpDir, readTmp, cleanupTmp } from "@/lib/pipeline/py";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.angle !== "number" || typeof body.requete !== "string" || typeof body.titre !== "string") {
    return NextResponse.json(
      { error: "Champs requis : angle (1-10), requete, titre" },
      { status: 400 }
    );
  }
  const stamp = `squel-${Date.now()}`;
  const outFile = path.join(TMP_DIR, `${stamp}.md`);
  await ensureTmpDir();
  const res = await runPy(SCRIPTS.squelette, [
    "--angle", String(body.angle),
    "--requete", body.requete,
    "--titre", body.titre,
    "--sortie", outFile,
  ]);
  const contenu = await readTmp(`${stamp}.md`);
  await cleanupTmp(stamp);

  if (res.code !== 0 || contenu === null) {
    return NextResponse.json(
      { error: "nouvel_article.py a échoué", stderr: res.stderr.slice(0, 500) },
      { status: 500 }
    );
  }
  return NextResponse.json({
    squelette: contenu,
    console: res.stdout.trim(),
  });
}
