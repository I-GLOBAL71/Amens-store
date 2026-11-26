---
name: agent-browser
description: >-
  Automatisation headless rapide par CLI (agent-browser) pour naviguer, inspecter,
  tester les vues desktop/mobile (393px), vérifier le rendu réel, les erreurs
  console et exécuter la sentinelle anti-régression (`scripts/regression-check.ts`).
---

# Browser Automation with agent-browser

Skill unifié entre `b2bpro` et `amens.store` (utilisé directement par `scripts/regression-check.ts`).

## Commandes essentielles

```bash
agent-browser --session check open http://127.0.0.1:3000/
agent-browser --session check set viewport 393 844
agent-browser --session check wait --load networkidle
agent-browser --session check snapshot -i --json
agent-browser --session check eval "document.body.innerText.length" --json
agent-browser --session check errors --json
agent-browser --session check screenshot --full check.png
agent-browser --session check close
```

## Vérification anti-régression du projet

```bash
bun run verify:regression
```

Vérifie la couverture du haut de page en desktop (`1440×900`) et mobile (`393×844`),
l'hydratation avec les vraies valeurs Labo, les 7 vues SPA, les marqueurs SSR
pour crawlers IA et zéro erreur console.
