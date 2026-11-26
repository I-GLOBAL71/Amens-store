#!/usr/bin/env python3
"""Gate finale de vérification du contenu (amens.store + garde-fou mobile b2bpro)."""

import argparse
from collections import Counter
from pathlib import Path
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


DISCLOSURE_CORE = "Ce guide contient des liens d'affiliation."

PLACEHOLDERS = [
    re.compile(r"\b(?:TODO|FIXME|TBD)\b"),
    re.compile(r"\bXXX+\b"),
    re.compile(r"\blorem\s+ipsum\b", re.I),
    re.compile(r"\[(?:A\s+COMPLETER|À\s+COMPLÉTER|LIEN_[^\]]+|NOM_[^\]]+|URL_[^\]]+)\]"),
    re.compile(r"contentReference\[oaicite:", re.I),
]

HALLUCINATION_PHRASES = [
    re.compile(r"\bselon\s+une\s+[ée]tude\s+r[ée]cente\b", re.I),
    re.compile(r"\bune\s+[ée]tude\s+r[ée]cente\s+(?:montre|prouve|d[ée]montre)\b", re.I),
    re.compile(r"\bde\s+nombreux\s+experts\s+(?:affirment|estiment|recommandent)\b", re.I),
    re.compile(r"\bles\s+statistiques\s+montrent\s+que\b", re.I),
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Gate finale verification-contenu")
    parser.add_argument("md_file", help="Fichier markdown à vérifier")
    parser.add_argument("--monetise", action="store_true", help="Exiger la disclosure d'affiliation")
    args = parser.parse_args()

    raw = Path(args.md_file).read_text(encoding="utf-8", errors="replace")
    issues: list[tuple[str, str]] = []

    # 1. Placeholders
    for pat in PLACEHOLDERS:
        m = pat.search(raw)
        if m:
            issues.append(("BLOQUANT", f"Placeholder ou résidu détecté : « {m.group(0)} »"))

    # 2. Hallucinations non sourcées
    for pat in HALLUCINATION_PHRASES:
        m = pat.search(raw)
        if m:
            issues.append(("BLOQUANT", f"Tournure non sourcée interdite : « {m.group(0)} » — citer la source ou mesure exacte"))

    # 3. Liens vides
    if re.search(r"\[[^\]]*\]\(\s*\)", raw) or re.search(r'href=["\']\s*["\']', raw, re.I):
        issues.append(("BLOQUANT", "Lien vide détecté ([]() ou href=\"\")"))

    # 4. Blocs de code fermés (garde-fou mobile b2bpro)
    fence_count = raw.count("```")
    if fence_count % 2 != 0:
        issues.append(("BLOQUANT", f"Bloc de code markdown non fermé ({fence_count} délimiteurs ```) — risque de débordement mobile"))

    # 5. Disclosure si monétisé
    if args.monetise and DISCLOSURE_CORE not in raw:
        issues.append(("BLOQUANT", "Disclosure d'affiliation manquante (« Ce guide contient des liens d'affiliation... »)"))

    # 6. Phrases longues dupliquées mot pour mot dans le même article
    prose_only = re.sub(r"```[\s\S]*?```", "", raw)
    sentences = [
        re.sub(r"\s+", " ", s.strip().lower())
        for s in re.split(r"[.!?…]+(?:\s+|\n|$)", prose_only)
        if len(s.strip()) > 55 and not s.strip().startswith("|")
    ]
    dups = [s for s, c in Counter(sentences).items() if c >= 2]
    if dups:
        issues.append(("BLOQUANT", f"Phrase longue dupliquée mot pour mot ({len(dups)}×) : « {dups[0][:60]}… »"))

    # 7. Avertissements fraîcheur / typographie / densité
    if re.search(r"\b(?:en\s+2022|en\s+2023|en\s+2024)\b", raw, re.I):
        issues.append(("AVERTISSEMENT", "Mention d'une année antérieure (2022-2024) — vérifier la fraîcheur des données"))

    em_count = raw.count("—")
    if em_count > 3:
        issues.append(("AVERTISSEMENT", f"{em_count} tirets cadratins (—) : réduire pour aligner la sobriété éditoriale b2bpro/amens"))

    if len(raw.split()) < 600:
        issues.append(("AVERTISSEMENT", f"Article court ({len(raw.split())} mots < 600)"))

    bloquants = sum(1 for lvl, _ in issues if lvl == "BLOQUANT")
    averts = sum(1 for lvl, _ in issues if lvl == "AVERTISSEMENT")

    for lvl, msg in issues:
        print(f"[{lvl}] {msg}")
    print(f"Bilan vérification : {bloquants} bloquant(s), {averts} avertissement(s)")
    if bloquants == 0:
        print("Verdict : OK pour relecture humaine")
    else:
        print("Verdict : PAS PRÊT À PUBLIER")
    return 1 if bloquants > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
