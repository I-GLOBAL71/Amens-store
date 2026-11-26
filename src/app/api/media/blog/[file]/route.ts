// Proxy cacheable pour les couvertures WebP hébergées sur Vercel Blob (store privé)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { findCoverByFileSlug } from "@/lib/article-image";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const safeName = path.basename(file);
  if (!/^[a-z0-9-]+\.webp$/i.test(safeName)) {
    return new Response("Not found", { status: 404 });
  }

  const localPath = path.join(process.cwd(), "public", "img", "blog", safeName);
  if (existsSync(localPath)) {
    const data = readFileSync(localPath);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const fileSlug = safeName.replace(/\.webp$/i, "");
  const entry = findCoverByFileSlug(fileSlug);
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!entry?.blobUrl || !token) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(entry.blobUrl, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!upstream.ok) {
    return new Response("Upstream unavailable", { status: upstream.status });
  }

  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
