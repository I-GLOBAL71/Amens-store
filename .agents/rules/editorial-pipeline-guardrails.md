# Règles du Pipeline Éditorial & Anti-Régression — amens.store

1. Lire `GUARDRAILS.md` avant toute modification structurelle.
2. Tout contenu publié ou modifié DOIT franchir les 7 gates du dossier `skills/` (`blueocean-keywords` → `pipeline-amens` → `seo-ultra` → `geo-citations-ia` → `humanisation-100` → `suppression-traces-ia` → `verification-contenu`) + la méthode unifiée `.agents/skills/redaction-seo-geo-aio/SKILL.md`.
3. Invisibilité visiteur : ne jamais exposer de termes SEO/GEO/AIO internes (SEO, GEO, AIO, Blue Ocean, KD proxy, GSC, Semrush, Ahrefs, llms.txt) dans le texte visible des vues publiques.
4. Validation obligatoire après changement : `bun run lint && bun run verify:regression`.
