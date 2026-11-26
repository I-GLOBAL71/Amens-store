---
name: pipeline-amens
description: >-
  Orchestrateur du pipeline éditorial unifié (amens.store + SGA™ b2bpro).
  Gère les 7 gates obligatoires de publication (blueocean-keywords → gabarit §4.2
  → seo-ultra → geo-citations-ia → humanisation-100 → suppression-traces-ia →
  verification-contenu) et génère des squelettes complets prêts à passer 100 %
  des contrôles machine.
---

# Pipeline Éditorial Unifié (7 Gates + SGA™)

Orchestrateur central : aucun contenu ne peut être publié sans franchir les
7 gates déterministes.

## Ordre d'exécution des 7 gates

1. `blueocean-keywords` : qualification de la requête (verdict `CIBLER` requis).
2. `pipeline-amens` (`gabarit.ts`) : structure §4.2 (8 sections, conclusion en tête 40–60 mots, tableau chiffré, FAQ 5–8 Q/R, disclosure §4.3 mot pour mot, lien `rel="sponsored"` + `utm_content`, maillage pilier + `/labo/`).
3. `seo-ultra` (`audit_meta.py`) : on-page HTML + H1 unique + Hn + JSON-LD (`Article`, `FAQPage`, `BreadcrumbList`) + ancrage mot-clé.
4. `geo-citations-ia` (`score_citabilite.py`) : score de citabilité IA ≥ 60/100 (bloquant < 40), blocs autonomes 134–167 mots, stats datées, question FAQ « Comment… ».
5. `humanisation-100` (`analyse_style.py`) : 0 marqueur IA bloquant, rythme humain (`variation ≥ 0,45`), 0 triptyme artificiel, zéro cadratin superflu.
6. `suppression-traces-ia` (`nettoyer_unicode.py`) : 0 caractère invisible / bidi / tag / homoglyphe.
7. `verification-contenu` (`check_contenu.py --monetise`) : 0 bloquant final (0 placeholder, 0 bloc de code non fermé pour le responsive mobile, 0 phrase hallucinatoire).

## Génération d'un squelette conforme

```bash
python skills/pipeline-amens/scripts/nouvel_article.py --angle 1 --requete "installer n8n" --titre "Installer n8n sur VPS en 10 minutes (guide 2026)" --sortie draft.md
```

## Références

- Les 10 angles et silos officiels : [angles.json](./references/angles.json)
