#!/usr/bin/env python3
"""Audit SEO on-page HTML pour seo-ultra (amens.store + SGA™ b2bpro)."""

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def norm(s: str) -> str:
    n = unicodedata.normalize("NFD", s.lower())
    n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    n = re.sub(r"['’]", " ", n)
    return re.sub(r"\s+", " ", n).strip()


class SeoHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title_parts: list[str] = []
        self.meta_description = ""
        self.h1_list: list[str] = []
        self.hn_count = 0
        self.h2_count = 0
        self._cur_heading: str | None = None
        self._cur_heading_buf: list[str] = []
        self.in_p = False
        self._cur_p: list[str] = []
        self.paragraphs: list[str] = []
        self.in_body = False
        self.in_script_ld = False
        self._cur_ld: list[str] = []
        self.jsonld_blocks: list[str] = []
        self.body_text_parts: list[str] = []
        self.tables = 0
        self.internal_links = 0
        self.external_links = 0
        self.sponsored_links = 0
        self.imgs_missing_alt = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {k.lower(): (v or "") for k, v in attrs}
        t = tag.lower()
        if t == "title":
            self.in_title = True
        elif t == "meta" and attr_map.get("name", "").lower() == "description":
            self.meta_description = attr_map.get("content", "").strip()
        elif t == "body":
            self.in_body = True
        elif t in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.hn_count += 1
            if t == "h2":
                self.h2_count += 1
            self._cur_heading = t
            self._cur_heading_buf = []
        elif t == "p":
            self.in_p = True
            self._cur_p = []
        elif t == "table":
            self.tables += 1
        elif t == "a":
            href = attr_map.get("href", "").strip()
            rel = attr_map.get("rel", "").lower()
            if "sponsored" in rel:
                self.sponsored_links += 1
            if href.startswith("/") or "amens.store" in href or "b2bpro.store" in href:
                self.internal_links += 1
            elif href.startswith("http"):
                self.external_links += 1
        elif t == "img":
            if not attr_map.get("alt", "").strip():
                self.imgs_missing_alt += 1
        elif t == "script" and attr_map.get("type", "").lower() == "application/ld+json":
            self.in_script_ld = True
            self._cur_ld = []

    def handle_endtag(self, tag: str) -> None:
        t = tag.lower()
        if t == "title":
            self.in_title = False
        elif t == "body":
            self.in_body = False
        elif t == self._cur_heading:
            text = " ".join("".join(self._cur_heading_buf).split())
            if t == "h1":
                self.h1_list.append(text)
            self._cur_heading = None
        elif t == "p" and self.in_p:
            self.in_p = False
            text = " ".join("".join(self._cur_p).split())
            if text:
                self.paragraphs.append(text)
        elif t == "script" and self.in_script_ld:
            self.in_script_ld = False
            raw = "".join(self._cur_ld).strip()
            if raw:
                self.jsonld_blocks.append(raw)

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._cur_heading is not None:
            self._cur_heading_buf.append(data)
        if self.in_p:
            self._cur_p.append(data)
        if self.in_script_ld:
            self._cur_ld.append(data)
        elif self.in_body:
            self.body_text_parts.append(data)


def extract_schema_types(blocks: list[str]) -> tuple[list[str], int]:
    types: list[str] = []
    invalid = 0

    def walk(obj: object) -> None:
        if isinstance(obj, dict):
            tp = obj.get("@type")
            if isinstance(tp, str):
                types.append(tp)
            elif isinstance(tp, list):
                types.extend(str(x) for x in tp)
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)

    for b in blocks:
        try:
            walk(json.loads(b))
        except Exception:
            invalid += 1
    return list(dict.fromkeys(types)), invalid


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit SEO on-page HTML")
    parser.add_argument("html_file", help="Fichier HTML à auditer")
    parser.add_argument("--motcle", default="", help="Mot-clé cible")
    parser.add_argument("--json", required=True, help="Chemin du rapport JSON")
    args = parser.parse_args()

    html = Path(args.html_file).read_text(encoding="utf-8", errors="replace")
    p = SeoHtmlParser()
    p.feed(html)

    title = " ".join("".join(p.title_parts).split())
    meta_desc = p.meta_description
    body_text = " ".join(" ".join(p.body_text_parts).split())
    nb_mots = len(body_text.split())
    schemas, invalid_ld = extract_schema_types(p.jsonld_blocks)

    problemes: list[dict[str, str]] = []

    if not title:
        problemes.append({"niveau": "BLOQUANT", "message": "Balise <title> absente ou vide"})
    elif len(title) > 75:
        problemes.append({"niveau": "AVERTISSEMENT", "message": f"Title long ({len(title)} car. > 75)"})
    elif len(title) < 25:
        problemes.append({"niveau": "AVERTISSEMENT", "message": f"Title court ({len(title)} car. < 25)"})

    if not meta_desc:
        problemes.append({"niveau": "BLOQUANT", "message": "Meta description absente"})
    elif len(meta_desc) > 175:
        problemes.append({"niveau": "AVERTISSEMENT", "message": f"Meta description longue ({len(meta_desc)} car. > 175)"})

    if len(p.h1_list) == 0:
        problemes.append({"niveau": "BLOQUANT", "message": "Aucun <h1> détecté dans la page"})
    elif len(p.h1_list) > 1:
        problemes.append({"niveau": "BLOQUANT", "message": f"Plusieurs <h1> détectés ({len(p.h1_list)} > 1)"})

    if p.h2_count < 3:
        problemes.append({"niveau": "AVERTISSEMENT", "message": f"Peu de sections <h2> ({p.h2_count} < 3)"})

    if args.motcle.strip():
        kw_tokens = [w for w in norm(args.motcle).split() if len(w) > 2]
        t_norm = norm(title)
        h1_norm = norm(" ".join(p.h1_list))
        head_norm = norm(" ".join(p.paragraphs[:2]))
        if kw_tokens:
            in_title = sum(1 for w in kw_tokens if w in t_norm or w in h1_norm)
            if in_title == 0:
                problemes.append(
                    {
                        "niveau": "AVERTISSEMENT",
                        "message": f"Mot-clé « {args.motcle} » absent du titre/H1",
                    }
                )
            in_head = sum(1 for w in kw_tokens if w in head_norm)
            if in_head == 0:
                problemes.append(
                    {
                        "niveau": "AVERTISSEMENT",
                        "message": f"Mot-clé « {args.motcle} » absent de l'introduction (answer-first)",
                    }
                )

    if p.tables < 1:
        problemes.append({"niveau": "AVERTISSEMENT", "message": "Aucun tableau HTML comparatif détecté"})

    if p.internal_links < 1:
        problemes.append({"niveau": "AVERTISSEMENT", "message": "Aucun lien interne détecté"})

    if p.sponsored_links < 1:
        problemes.append({"niveau": "AVERTISSEMENT", "message": 'Aucun lien affilié rel="sponsored" détecté'})

    if p.imgs_missing_alt > 0:
        problemes.append({"niveau": "AVERTISSEMENT", "message": f"{p.imgs_missing_alt} image(s) sans attribut alt"})

    if invalid_ld > 0:
        problemes.append({"niveau": "BLOQUANT", "message": f"{invalid_ld} bloc(s) JSON-LD invalide(s)"})
    elif not schemas:
        problemes.append({"niveau": "AVERTISSEMENT", "message": "Aucun schéma JSON-LD présent"})

    has_blocking = any(x["niveau"] == "BLOQUANT" for x in problemes)
    report = [
        {
            "ok": not has_blocking,
            "nb_mots": nb_mots,
            "nb_hn": p.hn_count,
            "tableaux": p.tables,
            "liens_internes": p.internal_links,
            "liens_externes": p.external_links,
            "liens_sponsored": p.sponsored_links,
            "schemas_jsonld": schemas,
            "problemes": problemes,
        }
    ]

    out_path = Path(args.json)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"SEO audit : {nb_mots} mots, {p.hn_count} Hn, {p.tables} tableau(x), {len(problemes)} remarque(s)")
    return 1 if has_blocking else 0


if __name__ == "__main__":
    raise SystemExit(main())
