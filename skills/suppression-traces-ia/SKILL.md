---
name: suppression-traces-ia
description: >-
  Hygiène technique déterministe en Python stdlib (Couche A watermarks-remover
  unifiée amens.store + b2bpro). Détecte et nettoie les caractères invisibles
  (zero-width, bidi overrides, Unicode tags), homoglyphes cyrilliques/grecs,
  espaces exotiques et métadonnées de génération IA.
---

# Suppression des Traces Techniques IA (Couche A)

Nettoyage déterministe sans dépendance externe : la couche technique se
nettoie par script, le style statistique se réécrit via `humanisation-100`.

## Commandes

```bash
# 1. Inspecter sans modifier
python skills/suppression-traces-ia/scripts/nettoyer_unicode.py <fichier.md> --inspecter

# 2. Nettoyer (génère <fichier.md>.clean)
python skills/suppression-traces-ia/scripts/nettoyer_unicode.py <fichier.md>

# 3. Nettoyer les métadonnées/artefacts de génération
python skills/suppression-traces-ia/scripts/nettoyer_metadonnees.py <fichier.md>
```

## Traces ciblées

- Espaces sans chasse et marqueurs invisibles (`\u200B-\u200D`, `\uFEFF`, `\u00AD`, `\u2060`).
- Contrôles bidirectionnels (`\u200E`, `\u200F`, `\u202A-\u202E`, `\u2066-\u2069`).
- Caractères d'étiquettes Unicode (`\U000E0000-\U000E007F`).
- Espaces exotiques (`\u2000-\u200A`, `\u202F`, `\u205F`, `\u3000`, `\u00A0`).
- Homoglyphes cyrilliques/grecs insérés dans des mots latins.
- Artefacts de citation LLM (`contentReference[oaicite:...]`, commentaires générateur).
