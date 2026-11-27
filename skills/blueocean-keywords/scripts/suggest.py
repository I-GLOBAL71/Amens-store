#!/usr/bin/env python3
"""Collecte réelle d'autocomplete Google/Bing sans clé API pour blueocean-keywords."""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# Couverture francophone mondiale par défaut :
# Europe (FR, BE, CH), Amérique du Nord (CA/Québec), Maghreb (MA, TN, DZ),
# Afrique de l'Ouest & Centrale (CI, SN, CM).
DEFAULT_FRANCOPHONE_COUNTRIES = "fr,be,ch,ca,ma,tn,dz,ci,sn,cm"
MODIFIERS_PROFONDEUR_2 = [
    "prix",
    "comment",
    "alternative",
    "gratuit",
    "sans carte",
    "vps",
    "comparatif",
    "renouvellement",
]


def fetch_google_suggest(query: str, hl: str, gl: str, timeout: float = 5.0) -> list[str]:
    params = urllib.parse.urlencode({"client": "chrome", "hl": hl, "gl": gl, "q": query})
    url = f"https://suggestqueries.google.com/complete/search?{params}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; AmensKeywords/2.0)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
            return [str(x).strip() for x in data[1] if str(x).strip()]
    except Exception:
        pass
    return []


def fetch_bing_suggest(query: str, timeout: float = 5.0) -> list[str]:
    params = urllib.parse.urlencode({"query": query})
    url = f"https://api.bing.com/osjson.aspx?{params}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; AmensKeywords/2.0)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
            return [str(x).strip() for x in data[1] if str(x).strip()]
    except Exception:
        pass
    return []


def collect_country(graine: str, hl: str, gl: str, profondeur: int, include_bing: bool, now_iso: str) -> dict:
    g_hits = fetch_google_suggest(graine, hl, gl)
    b_hits = fetch_bing_suggest(graine) if include_bing else []
    merged = list(dict.fromkeys([graine, *g_hits, *b_hits]))

    if profondeur >= 2:
        for mod in MODIFIERS_PROFONDEUR_2:
            extra = fetch_google_suggest(f"{graine} {mod}", hl, gl)
            for item in extra:
                if item not in merged:
                    merged.append(item)

    return {
        "graine": graine,
        "hl": hl,
        "gl": gl,
        "source": "autocomplete",
        "suggestions": {"direct": merged},
        "collecte_le": now_iso,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Collecte autocomplete Blue Ocean")
    parser.add_argument("--graine", required=True, help="Requête graine")
    parser.add_argument("--hl", default="fr", help="Langue")
    parser.add_argument(
        "--pays",
        default=DEFAULT_FRANCOPHONE_COUNTRIES,
        help="Codes pays séparés par virgule (francophonie mondiale par défaut)",
    )
    parser.add_argument("--profondeur", type=int, default=1, help="1 ou 2")
    parser.add_argument("--sortie", required=True, help="Fichier JSON de sortie")
    args = parser.parse_args()

    graine = args.graine.strip()
    pays_list = [p.strip().lower() for p in args.pays.split(",") if p.strip()] or ["fr"]
    now_iso = datetime.now(timezone.utc).isoformat()
    records_by_gl: dict[str, dict] = {}

    with ThreadPoolExecutor(max_workers=min(6, len(pays_list))) as pool:
        futures = {
            pool.submit(
                collect_country,
                graine,
                args.hl,
                gl,
                args.profondeur,
                idx == 0,
                now_iso,
            ): gl
            for idx, gl in enumerate(pays_list)
        }
        for fut in as_completed(futures):
            gl = futures[fut]
            try:
                records_by_gl[gl] = fut.result()
            except Exception:
                records_by_gl[gl] = {
                    "graine": graine,
                    "hl": args.hl,
                    "gl": gl,
                    "source": "autocomplete",
                    "suggestions": {"direct": [graine]},
                    "collecte_le": now_iso,
                }

    records = [records_by_gl[gl] for gl in pays_list]

    out_path = Path(args.sortie)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(len(r["suggestions"]["direct"]) for r in records)
    print(f"Autocomplete collecté : {total} suggestion(s) sur {len(records)} pays -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
