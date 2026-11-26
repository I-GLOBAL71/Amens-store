// Helpers purs de navigation et d'ancres sémantiques — partagés entre SSR et SPA
// afin que chaque lien interne et chaque ancre H2/H3 reste crawlable sans JS
// tout en alimentant le routeur client.
import type { ViewName } from "@/lib/pipeline/types";

export interface NavTarget {
  view?: ViewName;
  slug?: string | null;
  silo?: string | null;
  studioTab?: string | null;
  outil?: string | null;
  anchor?: string | null;
}

const VALID_VIEWS = new Set<ViewName>([
  "home",
  "blog",
  "article",
  "studio",
  "labo",
  "outils",
  "promos",
]);

/** Construit l'URL canonique relative correspondant exactement au routeur client. */
export function buildNavHref(target: NavTarget): string {
  const view = target.view ?? "home";
  const params = new URLSearchParams();
  if (view !== "home") params.set("v", view);
  if (target.slug && view === "article") params.set("slug", target.slug);
  if (target.silo && view === "blog") params.set("silo", target.silo);
  if (target.studioTab && view === "studio") params.set("tab", target.studioTab);
  if (target.outil && view === "outils") params.set("outil", target.outil);
  const qs = params.toString();
  const base = qs ? `/?${qs}` : "/";
  return target.anchor ? `${base}#${target.anchor}` : base;
}

/** Parse un lien interne Markdown ou HTML vers la cible SPA correspondante. */
export function parseInternalHref(url: string): NavTarget {
  const [rawPath, hashPart] = url.split("#");
  const anchor = hashPart ? hashPart : null;

  if (rawPath.includes("?")) {
    const q = rawPath.slice(rawPath.indexOf("?") + 1);
    const sp = new URLSearchParams(q);
    const vRaw = sp.get("v") as ViewName | null;
    const view: ViewName = vRaw && VALID_VIEWS.has(vRaw) ? vRaw : "home";
    return {
      view,
      slug: sp.get("slug"),
      silo: sp.get("silo"),
      studioTab: sp.get("tab"),
      outil: sp.get("outil"),
      anchor,
    };
  }

  const p = rawPath.replace(/^\/|\/$/g, "");
  if (!p) return { view: "home", anchor };

  const segments = p.split("/").filter(Boolean);
  const first = segments[0];
  if (first === "labo") return { view: "labo", anchor };
  if (first === "outils") return { view: "outils", outil: segments[1] ?? null, anchor };
  if (first === "promos") return { view: "promos", anchor };
  if (first === "blog") return { view: "blog", silo: segments[1] ?? null, anchor };
  if (segments.length >= 2) {
    return { view: "article", slug: segments.join("/"), anchor };
  }
  return { view: "blog", silo: first, anchor };
}

/** Normalise un titre de section H2/H3 en identifiant d'ancre HTML stable. */
export function slugifyHeading(titre: string): string {
  return titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
