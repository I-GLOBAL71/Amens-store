---
name: humanisation-100
description: >-
  Protocole d'humanisation unifié en 6 passes + Zero-AI-Trace (amens.store +
  b2bpro ai-writing-humanizer). Mesure objective via analyse_style.py : 0 marqueur
  lexical IA, variation de longueur de phrases (burstiness ≥ 0,45), absence de
  triptymes parallèles mécaniques, débuts de paragraphes variés et voix terrain
  incarnée sans perdre aucune donnée technique.
---

# Humanisation 100 % & Zéro Trace d'IA

Réécriture humaine guidée (jamais de double traduction qui dégrade le français)
combinée aux règles strictes anti-détection de `b2bpro` et `amens.store`.

## Exécution

```bash
python skills/humanisation-100/scripts/analyse_style.py <article.md>
```

## Les 6 passes obligatoires

1. **Purge des marqueurs IA (bloquant)** : supprimer *plongeons au cœur de*, *dans un monde en constante évolution*, *il convient de noter*, *force est de constater*, *en conclusion / en somme*, *non seulement X mais aussi Y*, *tapisserie / mosaïque / holistique / sans couture / catalyseur*, anglicismes IA (*delve, leverage, foster, streamline*) et toute auto-proclamation artificielle (*100 % humain*, *rédigé sans IA*, *en tant qu'IA*).
2. **Respiration & Burstiness** : alterner frappes courtes (3–7 mots) et phrases moyennes (12–20 mots) pour maintenir un coefficient de variation `≥ 0,45` et éviter 3 débuts de paragraphes identiques consécutifs.
3. **Incarnation & Expérience Terrain** : nommer un test réel, une durée chronométrée ou un écueil vécu (« Le pare-feu m'a bloqué 20 minutes… »).
4. **Concret local daté** : ancrer chaque tarif, latence ou condition dans sa date de relevé (`15/11/2026`, FCFA/EUR, Douala/Paris).
5. **Sobriété typographique** : éviter l'overdose de tirets cadratins `—` (0 en standard `b2bpro`, privilégier virgules, parenthèses ou deux-points), décimales françaises à la virgule (`99,98 %`).
6. **Mesure objective** : relancer `analyse_style.py` jusqu'au verdict `HUMAIN probable` sans perte d'information factuelle.
