---
name: blueocean-keywords
description: >-
  Recherche de mots-clés Blue Ocean et SGA™ unifiée (amens.store + b2bpro).
  Collecte l'autocomplete Google/Bing multi-pays francophones mondiaux
  (fr, be, ch, ca, ma, tn, dz, ci, sn, cm), applique le scoring proxy KD sans
  outil payant, le filtre 2/3 (CIBLER / SURVEILLER / IGNORER), l'ancrage tête
  commerciale 3-5 mots, la cartographie Query Fan-Out et l'anti-cannibalisation.
  Déclencher avant toute rédaction ou étude de niche.
---

# Blue Ocean Keywords + Méthode SGA™

Skill de qualification sémantique unifié : zéro volume inventé (classes
d'ordre de grandeur uniquement), validation par scripts Python exécutables et
prévention stricte de la cannibalisation.

## Quand l'utiliser

- Avant de rédiger un article, une fiche ou une page pilier.
- Pour qualifier une graine via `suggest.py` + `prioriser.py` (gate 1 du pipeline).
- Pour vérifier qu'une nouvelle intention ne cannibalise pas un contenu existant.

## Pipeline d'exécution

1. **Collecte multi-pays francophones (`scripts/suggest.py`)** :
   ```bash
   python skills/blueocean-keywords/scripts/suggest.py --graine "installer n8n" --hl fr --pays fr,be,ch,ca,ma,tn,dz,ci,sn,cm --profondeur 1 --sortie .pipeline-tmp/kw.json
   ```
2. **Scoring Blue Ocean (`scripts/prioriser.py`)** :
   ```bash
   python skills/blueocean-keywords/scripts/prioriser.py --entree .pipeline-tmp/kw.json --angle 1 --programme "Hostinger VPS" --sortie .pipeline-tmp/kw.csv
   ```
3. **Qualification SGA™ (héritée de b2bpro)** :
   - **Tête commerciale primaire (3–5 mots significatifs)** : ancrée mot pour mot dans le `title` / `H1` et dans les 250 premiers caractères (Answer-First).
   - **Query Fan-Out (5 axes IA)** : couvrir éligibilité, coût réel, processus pas-à-pas, spécifications/lieu (FR/Afrique) et variantes dans les H2/FAQ.
   - **Anti-cannibalisation** : 1 intention de recherche = 1 page (jamais deux URLs sur la même tête primaire).

## Critères du verdict Blue Ocean (≥ 2 conditions sur 3)

| Condition | Seuil | Verdict |
|---|---|---|
| Difficulté proxy (KD) | `< 35` (longue traîne, géo Afrique, panne, migration, promo, B2B) | 2 ou 3 conditions → `CIBLER` |
| Résistance AI Overviews | `fort` (tuto testé, calculateur, paiement local, diagnostic) | 1 condition → `SURVEILLER` |
| Potentiel d'affiliation | `fort` (intention commerciale/comparative/outage/migration) | 0 condition → `IGNORER` |

## Ressources

- Modifiers & préfixes de questions : [modifiers-fr.md](./references/modifiers-fr.md)
