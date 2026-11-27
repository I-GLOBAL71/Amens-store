"use client";

// Rendu Markdown des articles — liens internes routés vers les vues SPA,
// liens affiliés (utm_source=amens) en rel="sponsored" + disclosure contextuelle.
// Les liens internes sont de VRAIES ancres <a href="/?v=…"> : cliquables pour
// le lecteur, ET lisibles par les crawlers/agents IA sans JavaScript (le rendu
// serveur de /?v=… existe pour chacune de ces URL) — le clic normal est
// intercepté pour rester dans la navigation SPA.

import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useNav } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { buildNavHref, parseInternalHref, slugifyHeading } from "@/lib/nav";

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: ReactNode }>(node) && node.props?.children !== undefined) {
    return extractText(node.props.children);
  }
  return "";
}

export function Markdown({ content }: { content: string }) {
  const { navigate } = useNav();
  const { toast } = useToast();

  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h2: ({ children, ...props }) => (
            <h2 id={slugifyHeading(extractText(children))} className="scroll-mt-20" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 id={slugifyHeading(extractText(children))} className="scroll-mt-20" {...props}>
              {children}
            </h3>
          ),
          table: ({ children, ...props }) => (
            <div className="my-4 w-full max-w-full overflow-x-auto touch-pan-x rounded-lg border border-border">
              <table className="w-full min-w-[480px]" {...props}>
                {children}
              </table>
            </div>
          ),
          pre: ({ children, ...props }) => (
            <pre className="w-full max-w-full overflow-x-auto" {...props}>
              {children}
            </pre>
          ),
          a: ({ href, children }) => {
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
            const cible = parseInternalHref(url);
            const hrefInterne = buildNavHref(cible);
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
