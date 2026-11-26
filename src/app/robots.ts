// /robots.txt — généré par Next (route metadata). Invisible côté visiteur :
// crawler classiques + agents IA explicitement autorisés, sitemap déclaré.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // moteurs de recherche classiques
      { userAgent: "*", allow: "/" },
      // agents d'IA génératifs — autorisés explicitement (GEO, novembre 2026)
      ...[
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-Web",
        "anthropic-ai",
        "PerplexityBot",
        "Perplexity-User",
        "Google-Extended",
        "Applebot-Extended",
        "CCBot",
        "Bytespider",
        "cohere-ai",
        "Amazonbot",
        "DuckAssistBot",
        "YouBot",
        "MistralAI-User",
        "meta-externalagent",
      ].map((ua) => ({ userAgent: ua, allow: "/" })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
