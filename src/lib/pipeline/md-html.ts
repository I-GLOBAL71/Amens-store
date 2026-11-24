// Convertisseur Markdown → HTML minimal pour l'audit seo-ultra (audit_meta.py).
// Couvre les éléments que le script du skill analyse : Hn, <p>, <a>, <img>,
// <table>, blocs <pre><code>, listes et script JSON-LD.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(text: string): string {
  let t = escapeHtml(text);
  // liens [texte](url "title")
  t = t.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_m, txt: string, href: string, title?: string) => {
      const isExternal = href.startsWith("http");
      const isSponsored = isExternal && !href.includes("amens.store");
      const rel = isSponsored
        ? ' rel="sponsored"'
        : isExternal
          ? ' rel="noopener"'
          : "";
      return `<a href="${href}"${rel}${title ? ` title="${title}"` : ""}>${txt}</a>`;
    }
  );
  // gras / italique / code inline
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

export function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inTable = false;
  let listMode: "ul" | "ol" | null = null;
  let inQuote = false;

  const closeList = () => {
    if (listMode) {
      out.push(`</${listMode}>`);
      listMode = null;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push("</blockquote>");
      inQuote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blocs code
    if (trimmed.startsWith("```")) {
      closeList(); closeTable(); closeQuote();
      if (!inCode) {
        out.push("<pre><code>");
        inCode = true;
      } else {
        out.push("</code></pre>");
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(line));
      continue;
    }

    // Frontmatter --- (ignoré au rendu)
    if (i === 0 && trimmed === "---") {
      let j = 1;
      while (j < lines.length && lines[j].trim() !== "---") j++;
      i = j;
      continue;
    }

    // HTML brut (liens affiliés canoniques, scripts)
    if (/^<[a-zA-Z]/.test(trimmed) || trimmed.startsWith("<!--")) {
      closeList(); closeTable(); closeQuote();
      if (trimmed.startsWith("<!--")) continue;
      // ferme les tags de bloc propres
      out.push(trimmed);
      continue;
    }

    // Tableaux
    if (trimmed.startsWith("|")) {
      const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      if (/^[\s|:-]+$/.test(trimmed)) {
        continue; // ligne séparateur
      }
      if (!inTable) {
        closeList(); closeQuote();
        out.push(
          "<table><thead><tr>" +
            cells.map((c) => `<th>${inlineMd(c)}</th>`).join("") +
            "</tr></thead><tbody>"
        );
        inTable = true;
      } else {
        out.push("<tr>" + cells.map((c) => `<td>${inlineMd(c)}</td>`).join("") + "</tr>");
      }
      continue;
    } else {
      closeTable();
    }

    // Titres
    const h = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      closeList(); closeQuote();
      out.push(`<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`);
      continue;
    }

    // Citations >
    if (trimmed.startsWith(">")) {
      if (!inQuote) {
        closeList();
        out.push("<blockquote>");
        inQuote = true;
      }
      out.push(`<p>${inlineMd(trimmed.slice(1).trim())}</p>`);
      continue;
    } else {
      closeQuote();
    }

    // Listes
    const ul = trimmed.match(/^[-*]\s+(.+)$/);
    const ol = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ul || ol) {
      const mode = ul ? "ul" : "ol";
      if (listMode !== mode) {
        closeList();
        out.push(`<${mode}>`);
        listMode = mode;
      }
      out.push(`<li>${inlineMd((ul ?? ol)![1])}</li>`);
      continue;
    } else {
      closeList();
    }

    // Ligne vide
    if (!trimmed) continue;

    // Paragraphe (regroupe les lignes consécutives)
    let para = trimmed;
    let j = i + 1;
    while (j < lines.length) {
      const nxt = lines[j].trim();
      if (
        !nxt ||
        nxt.startsWith("```") ||
        nxt.startsWith("|") ||
        nxt.startsWith("#") ||
        nxt.startsWith(">") ||
        /^[-*]\s/.test(nxt) ||
        /^\d+[.)]\s/.test(nxt) ||
        /^<[a-zA-Z]/.test(nxt)
      )
        break;
      para += " " + nxt;
      j++;
    }
    i = j - 1;
    out.push(`<p>${inlineMd(para)}</p>`);
  }
  closeList(); closeTable(); closeQuote();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

export interface HtmlWrapperOptions {
  title: string; // <title> (metaTitle)
  metaDescription: string;
  h1: string; // ≠ title (règle seo-ultra)
  bodyHtml: string;
  jsonLd?: string;
}

/** Construit la page HTML complète passée à audit_meta.py (seo-ultra). */
export function wrapHtml(opts: HtmlWrapperOptions): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.metaDescription)}">
${opts.jsonLd ? `<script type="application/ld+json">${opts.jsonLd}</script>` : ""}
</head>
<body>
${opts.bodyHtml}
</body>
</html>`;
}
