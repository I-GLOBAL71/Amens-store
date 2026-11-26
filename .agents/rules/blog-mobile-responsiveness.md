# Règles d'Architecture et d'Excellence Mobile-First — amens.store

> Règle unifiée avec `b2bpro.store` pour garantir zéro débordement horizontal
> et une lisibilité irréprochable sur smartphones (320 px à 414 px+) comme sur desktop.

## 1. Zéro Débordement Horizontal (Zero Horizontal Overflow)
- Aucun élément sur `/` ou ses vues (`?v=home`, `blog`, `article`, `labo`, `outils`, `promos`, `studio`) ne doit provoquer de défilement horizontal de page sur mobile (testé à 393 px dans `scripts/regression-check.ts`).
- Les conteneurs racine et principaux (`src/components/amens/amens-app.tsx`, `article-view.tsx`) conservent `w-full min-w-0`.
- Tous les textes longs, URLs et codes inline appliquent le retour à la ligne (`break-words` / `overflow-wrap: anywhere`).

## 2. Standard du Rendu Markdown (`src/components/amens/markdown.tsx` & `src/app/globals.css`)
- **Tableaux comparatifs (`table`)** : défilement horizontal fluide sur mobile (`display: block; overflow-x: auto; white-space: nowrap`), repliement lisible à partir de `min-width: 768px` (`white-space: normal`).
- **Blocs de code (`pre`)** : `overflow-x: auto` obligatoire, jamais d'élargissement forcé du parent.
- **Intégrité Markdown** : chaque bloc ``` doit être strictement fermé (vérifié automatiquement par `skills/verification-contenu/scripts/check_contenu.py`).

## 3. Touch Targets & UX Accessible
- Cibles tactiles ≥ 40–44 px (chips de filtres, boutons CTA principaux, navigation).
- Footer sticky (`mt-auto`) et masquage du bouton flottant WhatsApp à l'approche du footer.
