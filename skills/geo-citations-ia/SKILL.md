---
name: geo-citations-ia
description: >-
  Moteur de citabilité GEO & AIO unifié (amens.store + SGA™ b2bpro). Fondé sur
  Princeton KDD 2024, C-SEO Bench 2025, AutoGEO ICLR 2026 et Google Search
  Central 2026 : blocs auto-suffisants de 134–167 mots, answer-first en tête,
  densité de chiffres datés, tableaux comparatifs extractibles, FAQ « Comment… »,
  llms.txt et ouverture explicite aux crawlers IA (GPTBot, ClaudeBot, PerplexityBot).
---

# GEO Citations IA + Activateurs SGA™

Optimise chaque guide pour être extrait et cité directement comme source n°1
par ChatGPT Search, Perplexity, Claude et Google AI Overviews.

## Exécution

```bash
python skills/geo-citations-ia/scripts/score_citabilite.py <article.md>
```

## Barème unifié sur 100 points (cible ≥ 60, bloquant < 40)

1. **Conclusion en tête / Answer-First (25 pts)** : premier paragraphe après le H1 entre 40 et 70 mots, contenant un chiffre ou tarif vérifié.
2. **Blocs citables RAG auto-suffisants (25 pts)** : paragraphes autonomes de 120–180 mots (zone optimale 134–167 mots) sans pronom flou en ouverture.
3. **Lisibilité et respiration (15 pts)** : paragraphes courts ou moyens équilibrés + listes structurées.
4. **Chiffres datés et unités précises (15 pts)** : densité de métriques sourcées (`%`, `€`, `FCFA`, `ms`, `Go`, dates `2026` / `dd/mm/2026`).
5. **Structure extractible SGA™ (20 pts)** : ≥ 1 tableau comparatif Markdown, débuts de phrase définitoires/actionnables et FAQ dont au moins une question en « Comment… ».

## Infrastructure technique obligatoire

- Autoriser `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` dans `robots.txt`.
- Maintenir `llms.txt` et les schémas JSON-LD (`Article`, `FAQPage`, `BreadcrumbList`) rendus côté serveur (SSR).
