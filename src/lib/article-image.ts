// Résolution des couvertures WebP 1200×630 d'amens.store (SEO/GEO Article.image & OG)
import manifest from "../../public/img/blog/manifest.json";
import { SITE_URL } from "@/lib/site";

const SITE_BASE = SITE_URL;

export interface CoverEntry {
  slug: string;
  fileSlug: string;
  localPath: string;
  blobUrl?: string;
  bytes: number;
}

export function coverFileSlug(slug: string): string {
  return slug.replaceAll("/", "-");
}

/** Retourne le chemin public local (/img/blog/...) pour un article. */
export function getArticleCoverPath(slug: string): string {
  const entry = (manifest as Record<string, CoverEntry>)[slug];
  if (entry?.localPath) return entry.localPath;
  return `/img/blog/${coverFileSlug(slug)}.webp`;
}

/**
 * Retourne l'URL publique absolue (https://amens.store/...) ou Blob public.
 * Note : si le store Vercel Blob est privé, l'URL publique sur le domaine
 * (/img/blog/... ou /api/media/blog/...) garantit un HTTP 200 aux bots Google/IA.
 */
export function getArticleCoverUrl(slug: string): string {
  const entry = (manifest as Record<string, CoverEntry>)[slug];
  if (entry?.blobUrl && entry.blobUrl.includes(".public.blob.vercel-storage.com")) {
    return entry.blobUrl;
  }
  return `${SITE_BASE}${getArticleCoverPath(slug)}`;
}

/** Fallback proxy si une future couverture dynamique est créée uniquement sur Blob. */
export function getArticleCoverProxyPath(slug: string): string {
  return `/api/media/blog/${coverFileSlug(slug)}.webp`;
}

/** Retourne l'entrée de manifeste correspondant à un nom de fichier slugifié. */
export function findCoverByFileSlug(fileSlug: string): CoverEntry | undefined {
  return Object.values(manifest as Record<string, CoverEntry>).find(
    (entry) => entry.fileSlug === fileSlug
  );
}
