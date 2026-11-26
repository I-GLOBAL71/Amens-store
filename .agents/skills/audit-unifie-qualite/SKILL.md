---
name: audit-unifie-qualite
description: >-
  Audit qualité multi-piliers unifié (amens.store + b2bpro). Combine les 7 gates
  du pipeline éditorial, la grille S+ à 5 piliers (SEO 30, GEO 25, Zéro Trace IA
  25, CRO 10, Intégrité/Mobile 10), la détection de duplication inter-articles et
  les sentinelles anti-régression (`verify:regression` / `guard`).
---

# Audit Unifié Qualité, CRO & Anti-Régression

Grille d'évaluation unifiée pour maintenir un niveau **Rang S+ (≥ 95/100)**
sans régression technique ni éditoriale.

## Les 5 Piliers de Contrôle

1. **SEO Fondamental (30 pts)** : titre 40–75 car. contenant le mot-clé cible, meta description 80–165 car., H1 unique, ≥ 3 H2, maillage interne valide + `rel="sponsored"`.
2. **GEO & Citabilité IA (25 pts)** : conclusion en tête 40–60 mots, blocs 134–167 mots auto-suffisants, chiffres datés, tableau Markdown, FAQ avec question « Comment… », JSON-LD SSR.
3. **Zéro Trace d'IA & Voix Humaine (25 pts)** : 0 marqueur IA bloquant, 0 caractère invisible Unicode, variation de phrase `≥ 0,45`, 0 triptyme mécanique, sobriété typographique (0 à 1 cadratin max, virgule décimale FR), 0 répétition inter-articles.
4. **Conversion CRO & Transparence (10 pts)** : ancrage tarifaire daté (promo + renouvellement), CTA contextuel tracé (`utm_content`), disclosure d'affiliation mot pour mot.
5. **Intégrité Technique & Mobile-First (10 pts)** : blocs de code ``` fermés, zéro débordement horizontal à 393 px, zéro fuite de jargon interne sur les vues publiques, hydratation SSR propre.

## Commandes de validation

- Pipeline complet sur un fichier/contenu : `bun run scripts/audit-contenu.ts`
- Sentinelle code + API + SSR + navigateur : `bun run lint && bun run verify:regression`
- Tests unitaires des skills unifiés : `bun test tests/unified-skills.test.ts`
