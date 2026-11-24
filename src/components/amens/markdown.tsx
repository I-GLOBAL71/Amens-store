"use client";

// Rendu Markdown des articles — liens internes routés vers les vues SPA,
// liens affiliés (utm_source=amens) en rel="sponsored" + disclosure contextuelle.
// Les liens internes sont de VRAIES ancres <a href="/?v=…"> : cliquables pour
// le lecteur, ET lisibles par les crawlers/agents IA sans JavaScript (le rendu
// serveur de /?v=… existe pour chacune de ces URL) — le clic normal est
// intercepté pour rester dans la navigation SPA.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useNav } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export function Markdown({ content }: { content: string }) {
  const { navigate } = useNav();
  const { toast } = useToast();

  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => {
            const url = href ?? "";
            const isExternal = url.startsWith("http");
            const isSponsored = url.includes("utm_source=amens");
            if (isSponsored) {
              return (
                <a
                  href={url}
                  rel="sponsored noopener"
                  target="_blank"
                  className="font-semibold"
                  title="Lien d'affiliation — commission pour nous, sans surcoût pour toi"
                  onClick={() =>
                    toast({
                      title: "Lien d'affiliation",
                      description:
                        "Si tu souscris via ce lien, nous touchons une commission, sans surcoût pour toi.",
                    })
                  }
                >
                  {children}
                </a>
              );
            }
            if (isExternal) {
              return (
                <a href={url} rel="noopener" target="_blank">
                  {children}
                </a>
              );
            }
            // Lien interne → vraie ancre (href réel pour crawlers/IA) + routage SPA au clic
            const p = url.replace(/^\/|\/$/g, "");
            const premier = p.split("/")[0];
            const cible =
              premier === "labo"
                ? { view: "labo" as const }
                : premier === "outils"
                  ? { view: "outils" as const }
                  : premier === "promos"
                    ? { view: "promos" as const }
                    : { view: "blog" as const, silo: premier || null };
            const hrefInterne =
              `/?v=${cible.view}` + (cible.view === "blog" && cible.silo ? `&silo=${cible.silo}` : "");
            return (
              <a
                href={hrefInterne}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  navigate(cible);
                }}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
