#!/usr/bin/env python3
"""Scoring proxy KD Blue Ocean + filtre 2/3 (CIBLER / SURVEILLER / IGNORER)."""

import argparse
import csv
import json
from pathlib import Path
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


FRANCOPHONE_PAYS_TERMS = {
    # Europe & Amérique du Nord francophones
    "france": "fr",
    ".fr": "fr",
    "paris": "fr",
    "lyon": "fr",
    "marseille": "fr",
    "belgique": "be",
    "bruxelles": "be",
    "wallonie": "be",
    ".be": "be",
    "suisse": "ch",
    "geneve": "ch",
    "lausanne": "ch",
    "romand": "ch",
    ".ch": "ch",
    "chf": "ch",
    "canada": "ca",
    "quebec": "ca",
    "montreal": "ca",
    ".ca": "ca",
    "cad": "ca",
    # Maghreb francophone
    "maroc": "ma",
    "casablanca": "ma",
    "rabat": "ma",
    "marrakech": "ma",
    ".ma": "ma",
    "dirham": "ma",
    "tunisie": "tn",
    "tunis": "tn",
    ".tn": "tn",
    "algerie": "dz",
    "alger": "dz",
    ".dz": "dz",
    "baridimob": "dz",
    "edahabia": "dz",
    "cib": "dz",
    # Afrique subsaharienne francophone
    "cameroun": "cm",
    "camerounais": "cm",
    "douala": "cm",
    "yaounde": "cm",
    ".cm": "cm",
    "cote d'ivoire": "ci",
    "ivoirien": "ci",
    "abidjan": "ci",
    ".ci": "ci",
    "senegal": "sn",
    "senegalais": "sn",
    "dakar": "sn",
    ".sn": "sn",
    "congo": "cd",
    "rdc": "cd",
    "kinshasa": "cd",
    ".cd": "cd",
    "benin": "bj",
    "cotonou": "bj",
    ".bj": "bj",
    "togo": "tg",
    "lome": "tg",
    ".tg": "tg",
    "burkina": "bf",
    "ouagadougou": "bf",
    ".bf": "bf",
    "mali": "ml",
    "bamako": "ml",
    ".ml": "ml",
    "guinee": "gn",
    "conakry": "gn",
    ".gn": "gn",
    "gabon": "ga",
    "libreville": "ga",
    ".ga": "ga",
    "madagascar": "mg",
    "antananarivo": "mg",
    ".mg": "mg",
    # Moyens de paiement / devises transverses francophones
    "fcfa": "afrique",
    "xof": "afrique",
    "xaf": "afrique",
    "orange money": "afrique",
    "mtn": "afrique",
    "momo": "afrique",
    "wave": "afrique",
    "moov": "afrique",
    "airtel money": "afrique",
    "mpesa": "afrique",
    "mobile money": "afrique",
    "afrique": "afrique",
    "francophone": "global-fr",
}

AFRICA_LOW_COMP_CODES = {"cm", "ci", "sn", "cd", "bj", "tg", "bf", "ml", "gn", "ga", "mg", "ma", "tn", "dz", "afrique"}
REGIONAL_FR_CODES = {"be", "ch", "ca", "global-fr"}

NICHE_BLUE_OCEAN_TERMS = (
    "n8n",
    "ollama",
    "open webui",
    "coolify",
    "dify",
    "flowise",
    "librechat",
    "lovable",
    "bolt",
    "cursor",
    "v0",
    "replit",
    "windsurf",
    "claude code",
    "mcp",
    "agent ia",
    "llm local",
    "vercel",
    "supabase",
    "docker",
    "orange money",
    "mobile money",
    "momo",
    "wave",
    "moov",
    "baridimob",
    "edahabia",
    "carte virtuelle",
    "fcfa",
    "dirham",
    "sans carte",
    "renouvellement",
    "vrai cout",
    "quitter",
    "annuler",
    "resilier",
    "migrer",
    "alternative",
    "black friday",
    "cyber monday",
    "code promo",
    "email pro",
    "spf",
    "dkim",
    "dmarc",
    "zoho",
    "google workspace",
    "en panne",
    "panne",
    "down",
    "statut",
    "ecole",
    "eglise",
    "ong",
    "restaurant",
    "agence",
    "multi-sites",
    "white label",
    "clients",
    "marge",
    "revendeur",
    "vps",
    "hostinger",
    "ovh",
    "o2switch",
    "contabo",
    "cloudways",
    "kinsta",
    "nindohost",
    "infomaniak",
    "planethoster",
    "hetzner",
    "ionos",
    "lws",
    "ex2",
    "whc",
)

OFF_TOPIC_HOUSING_SIGNALS = (
    "attestation d'hebergement",
    "attestation d hebergement",
    "attestation hebergement",
    "certificat d'hebergement",
    "certificat d hebergement",
    "hebergement touristique",
    "hebergement insolite",
    "hebergement temporaire",
    "hebergement d'urgence",
    "hebergement d urgence",
    "hebergement hotel",
    "hebergement airbnb",
    "visa",
    "airbnb",
    "chambre",
    "appartement",
    "logement",
    "vacances",
    "marrakech",
    "agadir",
    "tourisme",
    "residence permanente",
    "titre de sejour",
    "passeport",
    "carte vitale",
    "carte grise",
    "permis de conduire",
    "carte nationale",
)

WEB_TECH_ANCHORS = (
    "web",
    "site",
    "vps",
    "cloud",
    "domaine",
    "serveur",
    "wordpress",
    "n8n",
    "ollama",
    "docker",
    "email",
    "ssl",
    "dns",
    "hostinger",
    "ovh",
    "o2switch",
    "nindohost",
    "infomaniak",
)

AIO_RESISTANT_SIGNALS = (
    "installer",
    "deployer",
    "déployer",
    "mettre en ligne",
    "configurer",
    "migrer",
    "quitter",
    "annuler",
    "en panne",
    "panne",
    "down",
    "orange money",
    "momo",
    "wave",
    "sans carte",
    "renouvellement",
    "prix",
    "cout",
    "coût",
    "marge",
    "black friday",
    "code promo",
    "creer",
    "créer",
    "email pro",
    "ecole",
    "école",
    "clients",
    "comparatif",
    "calcul",
)

AFFILIATION_SIGNALS = (
    "hebergeur",
    "hébergeur",
    "heberger",
    "héberger",
    "vps",
    "hostinger",
    "contabo",
    "o2switch",
    "ovh",
    "cloudways",
    "kinsta",
    "nindohost",
    "vercel",
    "n8n",
    "lovable",
    "bolt",
    "orange money",
    "mobile money",
    "email pro",
    "domaine",
    "black friday",
    "promo",
    "renouvellement",
    "quitter",
    "migrer",
    "alternative",
    "agence",
    "clients",
    "ecole",
    "école",
    "site web",
)


def strip_accents(s: str) -> str:
    rep = str.maketrans("éèêëàâäîïôöùûüç", "eeeeaaaiioouuuc")
    return s.lower().translate(rep)


def score_query(requete: str, angle: int, programme: str, variants_count: int) -> dict:
    norm = strip_accents(requete.strip())
    words = [w for w in re.split(r"\s+", norm) if w]
    n_words = len(words)

    pays_hits = sorted({code for term, code in FRANCOPHONE_PAYS_TERMS.items() if term in norm})
    if not pays_hits:
        pays_hits = ["fr"]

    has_web_anchor = any(a in norm for a in WEB_TECH_ANCHORS)
    is_off_topic_housing = not has_web_anchor and any(
        strip_accents(t) in norm for t in OFF_TOPIC_HOUSING_SIGNALS
    )
    if is_off_topic_housing:
        return {
            "requete": requete.strip().lower(),
            "longueur_mots": n_words,
            "pays_detectes": "|".join(pays_hits),
            "nb_variantes": variants_count,
            "classes_volume": "basse",
            "score_difficulte": 80,
            "resistance_aio": "faible",
            "potentiel_affiliation": "faible",
            "verdict": "IGNORER",
        }

    # Score de difficulté proxy (0 = très facile, 100 = ultra compétitif)
    kd = 56
    if n_words >= 5:
        kd -= 22
    elif n_words >= 3:
        kd -= 14
    elif n_words == 2:
        kd -= 6
    else:
        kd += 18

    niche_matches = sum(1 for t in NICHE_BLUE_OCEAN_TERMS if strip_accents(t) in norm)
    if niche_matches >= 2:
        kd -= 18
    elif niche_matches == 1:
        kd -= 11

    if any(c in AFRICA_LOW_COMP_CODES for c in pays_hits):
        kd -= 10
    elif any(c in REGIONAL_FR_CODES for c in pays_hits):
        kd -= 6
    if any(q in norm for q in ("comment ", "pourquoi ", "combien ", "sans ")):
        kd -= 6
    if 1 <= angle <= 10 and niche_matches >= 1:
        kd -= 4

    kd = max(8, min(92, kd))

    # Résistance AI Overviews (tutos pas-à-pas, prix datés, outils, géo francophone, pannes)
    aio_hits = sum(1 for t in AIO_RESISTANT_SIGNALS if strip_accents(t) in norm)
    if aio_hits >= 1 or n_words >= 4 or any(c in AFRICA_LOW_COMP_CODES or c in REGIONAL_FR_CODES for c in pays_hits):
        resistance_aio = "fort"
    elif n_words >= 2 and niche_matches >= 1:
        resistance_aio = "moyen"
    else:
        resistance_aio = "faible"

    # Potentiel d'affiliation
    aff_hits = sum(1 for t in AFFILIATION_SIGNALS if strip_accents(t) in norm)
    if aff_hits >= 1 or bool(programme.strip()):
        potentiel = "fort"
    elif n_words >= 3:
        potentiel = "moyen"
    else:
        potentiel = "faible"

    # Classe d'ordre de grandeur (jamais de volume exact inventé)
    # Une requête qui remonte dans >= 3 pays francophones simultanément a une
    # demande transversale élevée sur Google Suggest.
    if variants_count >= 3 or (n_words <= 3 and niche_matches >= 1 and variants_count >= 2):
        classe_volume = "élevée"
    elif n_words <= 4 or variants_count >= 2 or niche_matches >= 1:
        classe_volume = "moyenne"
    else:
        classe_volume = "basse"

    # Filtre cahier des charges : >= 2 conditions sur 3 -> CIBLER
    conds = 0
    if kd < 38:
        conds += 1
    if resistance_aio == "fort":
        conds += 1
    if potentiel == "fort":
        conds += 1

    if conds >= 2:
        verdict = "CIBLER"
    elif conds == 1:
        verdict = "SURVEILLER"
    else:
        verdict = "IGNORER"

    return {
        "requete": requete.strip().lower(),
        "longueur_mots": n_words,
        "pays_detectes": "|".join(pays_hits),
        "nb_variantes": variants_count,
        "classes_volume": classe_volume,
        "score_difficulte": kd,
        "resistance_aio": resistance_aio,
        "potentiel_affiliation": potentiel,
        "verdict": verdict,
    }


def extract_queries(raw_items: object) -> dict[str, int]:
    counts: dict[str, int] = {}
    items = raw_items if isinstance(raw_items, list) else [raw_items]
    for entry in items:
        if not isinstance(entry, dict):
            continue
        sugg = entry.get("suggestions", {})
        candidates: list[str] = []
        if isinstance(sugg, dict):
            for vals in sugg.values():
                if isinstance(vals, list):
                    candidates.extend(str(v) for v in vals)
        elif isinstance(sugg, list):
            candidates.extend(str(v) for v in sugg)
        graine = entry.get("graine")
        if isinstance(graine, str) and graine.strip():
            candidates.append(graine.strip())
        for q in candidates:
            key = q.strip().lower()
            if key:
                counts[key] = counts.get(key, 0) + 1
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description="Scoring proxy KD Blue Ocean")
    parser.add_argument("--entree", required=True, help="Fichier JSON d'entrée")
    parser.add_argument("--angle", type=int, default=1, help="Angle 1-10")
    parser.add_argument("--programme", default="", help="Programme d'affiliation visé")
    parser.add_argument("--sortie", required=True, help="Fichier CSV de sortie")
    args = parser.parse_args()

    in_path = Path(args.entree)
    raw = json.loads(in_path.read_text(encoding="utf-8"))
    queries = extract_queries(raw)

    rows = [score_query(q, args.angle, args.programme, cnt) for q, cnt in queries.items()]
    order_rank = {"CIBLER": 0, "SURVEILLER": 1, "IGNORER": 2}
    volume_rank = {"élevée": 0, "moyenne": 1, "basse": 2}
    rows.sort(
        key=lambda r: (
            order_rank.get(r["verdict"], 9),
            volume_rank.get(r["classes_volume"], 9),
            r["score_difficulte"],
            r["requete"],
        )
    )

    out_path = Path(args.sortie)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "requete",
        "longueur_mots",
        "pays_detectes",
        "nb_variantes",
        "classes_volume",
        "score_difficulte",
        "resistance_aio",
        "potentiel_affiliation",
        "verdict",
    ]
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    cibler = sum(1 for r in rows if r["verdict"] == "CIBLER")
    surveiller = sum(1 for r in rows if r["verdict"] == "SURVEILLER")
    ignorer = sum(1 for r in rows if r["verdict"] == "IGNORER")
    print(f"CIBLER : {cibler} | SURVEILLER : {surveiller} | IGNORER : {ignorer}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
