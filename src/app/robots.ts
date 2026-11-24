// /robots.txt — généré par Next (route metadata). Invisible côté visiteur :
// crawler classiques + agents IA explicitement autorisés, sitemap déclaré.
import type { MetadataRoute } from "next";

const BASE = "https://amens.store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // moteurs de recherche classiques
      { userAgent: "*", allow: "/" },
      // agents d'IA génératifs — autorisés explicitement (GEO, juin 2026)
      ...[
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-Web",
        "anthropic-ai",
        "PerplexityBot",
        "Google-Extended",
        "Applebot-Extended",
        "CCBot",
        "Bytespider",
      ].map((ua) => ({ userAgent: ua, allow: "/" })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
