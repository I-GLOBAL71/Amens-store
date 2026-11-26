---
name: verification-contenu
description: >-
  Gate finale de publication en 7 étapes (amens.store + garde mobile/qualité
  b2bpro). Vérifie zéro placeholder, zéro tournure hallucinatoire non sourcée,
  fraîcheur des dates, intégrité des liens, fermeture stricte des blocs de code
  (zéro débordement mobile), présence de la disclosure d'affiliation et unicité
  des phrases. Zéro bloquant requis sinon publication refusée.
---

# Vérification Finale du Contenu (Gate 7)

Mieux vaut 0 page qu'une page fausse ou cassée sur mobile.

## Exécution

```bash
python skills/verification-contenu/scripts/check_contenu.py <article.md> --monetise
```

## Les 7 contrôles de la gate finale

1. **Conformité & Disclosure (`--monetise`)** : présence exacte de la mention légale d'affiliation (`Ce guide contient des liens d'affiliation...`).
2. **Zéro Placeholder** : aucun `TODO`, `FIXME`, `XXX`, `lorem ipsum`, `[LIEN_...]`, `[NOM_...]`.
3. **Zéro Hallucination floue** : interdiction des formules sans source (*« selon une étude récente »*, *« de nombreux experts affirment »*).
4. **Intégrité des liens** : aucun lien Markdown `[]()` ou `[texte]()` ni attribut `href=""` vide.
5. **Sécurité Mobile-First (héritée de b2bpro)** : parité stricte des délimiteurs ```` ``` ```` (un bloc non fermé casse le rendu et provoque un débordement horizontal sur 320–393 px).
6. **Fraîcheur & Typographie** : alerte sur les millésimes périmés présentés comme actuels et sur l'excès de tirets cadratins (`—`).
7. **Originalité interne** : aucune phrase longue (> 55 car.) dupliquée mot pour mot dans le même article.
