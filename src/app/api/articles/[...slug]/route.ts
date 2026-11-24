// Article individuel + incrément de vues + programmes affiliés associés.
// Délègue à loadArticleDetail (source unique partagée avec le SSR de /) :
// la forme de la réponse est garantie identique côté API et côté HTML SSR.
import { NextResponse } from "next/server";
import { loadArticleDetail } from "@/lib/article-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug.join("/"));
  const payload = await loadArticleDetail(decodedSlug, { incrementViews: true });
  if (!payload) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }
  return NextResponse.json(payload);
}
