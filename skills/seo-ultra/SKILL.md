---
name: seo-ultra
description: >-
  Audit SEO on-page unifié (amens.store + SGA™ b2bpro). Vérifie longueurs
  title/meta, unicité du H1, hiérarchie Hn, ancrage du mot-clé primaire dans le
  titre et les 250 premiers caractères, tableaux HTML, maillage interne/sponsored
  et validité JSON-LD (Article, FAQPage, BreadcrumbList). Bloquant en pipeline.
---

# SEO Ultra (On-Page + Technique SGA™)

Contrôle déterministe du HTML rendu pour garantir l'indexation optimale sur
Google, Bing et les crawlers IA sans JavaScript.

## Exécution

```bash
python skills/seo-ultra/scripts/audit_meta.py <fichier.html> --motcle "<requete>" --json <rapport.json>
```

## Critères vérifiés (unifiés amens.store + b2bpro)

- **Title & Meta** : `<title>` non vide (cible 35–70 car.), `<meta name="description">` non vide (cible 80–165 car.).
- **H1 & Hiérarchie Hn** : exactement 1 `<h1>` sur la page (bloquant si 0 ou > 1), ≥ 3 `<h2>` structurants.
- **Ancrage sémantique SGA™** : présence des termes significatifs du mot-clé cible dans `<title>` et dans l'introduction.
- **Maillage & Affiliation** : liens internes présents, liens affiliés marqués `rel="sponsored"`.
- **Tableaux & Données Structurées** : ≥ 1 `<table>` comparatif, schémas JSON-LD valides (`Article`, `FAQPage`, `BreadcrumbList`).
