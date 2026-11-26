// Configuration canonique du site — amens.store
// Aligne canonicals, sitemap.xml, robots.txt, OpenGraph, JSON-LD et llms.txt
// sur le domaine primaire Vercel (https://www.amens.store) pour éviter toute
// redirection 308 dans Google Search Console.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.amens.store").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
