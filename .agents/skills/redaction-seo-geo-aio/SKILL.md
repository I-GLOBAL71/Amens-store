---
name: redaction-seo-geo-aio
description: >-
  Skill rédactionnel unifié (Méthode SGA™ b2bpro + Pipeline 7 gates amens.store).
  Se déclenche automatiquement pour toute rédaction, réécriture ou optimisation
  d'article, guide ou fiche. Garantit la qualification mots-clés Blue Ocean +
  Query Fan-Out, la structure Answer-First, la citabilité IA (Princeton KDD 2024
  + blocs 134–167 mots), l'humanisation 100 % sans trace d'IA, la sécurité mobile
  et le passage complet des gates automatisées avant publication.
---

# Rédaction Élite Unifiée — SGA™ + Pipeline 7 Gates

Ce skill unifie la **Méthode SGA™** (`b2bpro.store`) et la **chaîne 7 gates**
(`amens.store`) pour maximiser le trafic organique Google, la citation directe
par les IA (ChatGPT Search, Perplexity, Claude, AI Overviews) et la conversion.

## Workflow obligatoire (7 étapes)

1. **Qualification Mots-Clés (`blueocean-keywords`)** :
   - Valider la requête cible (`verdict = CIBLER`, KD proxy faible, résistance AI Overviews forte, potentiel commercial fort).
   - Ancrer une tête commerciale **3–5 mots significatifs** dans le `title`/H1 et dans les **250 premiers caractères**.
   - Couvrir les 5 axes **Query Fan-Out** (éligibilité, coût réel, étapes, specs/géo FR+Afrique, variantes).
2. **Architecture & Gabarit (`pipeline-amens`)** :
   - Générer le squelette avec `nouvel_article.py` (conclusion en tête 40–60 mots, 8 sections §4.2, FAQ 5–8 Q/R dont une question d'ouverture en « Comment… », tableau comparatif, disclosure §4.3 mot pour mot, lien affilié `rel="sponsored"` + `utm_content`, maillage pilier + `/labo/`).
3. **Audit SEO On-Page (`seo-ultra`)** :
   - Un seul H1, ≥ 3 H2, JSON-LD (`Article`, `FAQPage`, `BreadcrumbList`) rendu côté serveur, ancres descriptives à entité nommée.
4. **Citabilité IA (`geo-citations-ia`)** :
   - Score `≥ 60/100` (cible ≥ 85) : blocs auto-suffisants de 134–167 mots sans pronom flou, ≥ 5 chiffres datés pour 500 mots, tableau comparatif Markdown.
5. **Humanisation & Zéro Trace d'IA (`humanisation-100`)** :
   - 0 marqueur IA bloquant (*plongeons au cœur de*, *il convient de noter*, *force est de constater*, *en conclusion*, *non seulement… mais aussi*, *delve/leverage/tapestry*).
   - Burstiness vivante (`variation ≥ 0,45`), phrases courtes de 3–7 mots mêlées aux analyses, vécu terrain concret, sobriété sur les cadratins (`—` à éviter/remplacer par virgule ou deux-points).
6. **Hygiène Technique (`suppression-traces-ia`)** :
   - Purge déterministe de tout caractère invisible Unicode, bidi override, tag ou homoglyphe (`nettoyer_unicode.py`, `nettoyer_metadonnees.py`).
7. **Gate Finale & Sécurité Mobile (`verification-contenu`)** :
   - 0 placeholder, 0 tournure hallucinatoire non sourcée, 0 lien vide, blocs ``` tous fermés (zéro débordement mobile 320–393 px), disclosure présente (`check_contenu.py --monetise`).

## Vérification machine

- Analyse complète du pipeline : `POST /api/pipeline` ou `bun run scripts/audit-contenu.ts`
- Sentinelle anti-régression complète : `bun run lint && bun run verify:regression`
