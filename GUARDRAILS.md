# GUARDRAILS — sécurisation anti-régression · amens.store

## Règle d'or

Après TOUTE implémentation (nouvelle fonctionnalité, correction, refonte), la
sentinelle doit être **VERTE** avant de considérer le travail terminé :

```bash
bun run lint && bun run verify:regression
```

Pour un changement visuel : vérifier en plus, dans le navigateur, le rendu de `/`
(haut de page couvert — desktop ET mobile 393 px). Le code sortie de la sentinelle
est `0` (vert) / `1` (rouge) : utilisable dans toute automatisation.

## La sentinelle

| Élément | Emplacement |
|---|---|
| Script de vérification (53 contrôles) | `scripts/regression-check.ts` |
| Seuils planchers protégés | `config/regression-baseline.json` |
| Dernier rapport horodaté | `config/regression-last-run.json` |
| Endpoint santé interne | `GET /api/sante` (invisible visiteur) |
| Veille automatique | cron quotidien 09:00 (Africa/Douala) |

Contrôles couverts : lint, serveur joignable, HTML SSR avec **vraies valeurs**
(croisées avec `/api/labo`), formes des APIs, seuils de baseline, rendu navigateur
des 7 vues avec marqueurs protégés, couverture positionnelle du 4/5 supérieur
accueil desktop + mobile 393 px, hydratation, zéro erreur de page, invisibilité
visiteur (termes stratégiques interdits dans le texte visible).

## Fonctionnalités protégées (invariants)

1. **Route unique `/`** — SPA à état dans l'URL (`?v=…&slug=…`) : les 7 vues
   (home, blog, article, studio, labo, outils, promos) doivent rendre leur
   marqueur protégé.
2. **Injection SSR** (`src/app/page.tsx` → cache TanStack Query prérempli dans
   `amens-app.tsx`) : le HTML de `/` contient les vraies valeurs (uptime moyen,
   latence, compteur de guides) — c'est LE correctif « 4/5 supérieur de la page
   d'accueil vide ». Ne JAMAIS le retirer ni repasser à un chargement client pur.
3. **Couverture du 4/5 supérieur de l'accueil**, desktop et mobile 393 px
   (sondes positionnelles + marqueurs textuels).
4. **ErrorBoundary par vue** (`src/components/amens/error-boundary.tsx`).
5. **Assistant « 3 questions → ton hébergeur »** : recommandation principale,
   alternatives testées, fallback si les données ne chargent pas, mention Mobile
   Money (Orange Money, MTN MoMo, Wave).
6. **Labo public** : uptime/latence/prix + méthodologie publique, KPI cohérents
   (moyennes dans les bornes).
7. **Invisibilité visiteur** : aucun terme stratégique (SEO, GEO, AIO,
   AI Overviews, ChatGPT/Perplexity/Gemini comme leviers, Blue Ocean,
   GSC/Semrush/Ahrefs, KD, llms.txt…) dans le TEXTE VISIBLE de la surface
   visiteur (vues reliées dans la navigation). Le Studio (`?v=studio`) est un
   dashboard interne non relié : son rendu est vérifié, ses libellés internes
   restent hors périmètre. Les optimisations elles-mêmes (meta, structure
   éditoriale, robots.txt / llms.txt / sitemap aux chemins standards) restent
   **dans le code**, invisibles.
8. **APIs** : `/api/labo`, `/api/articles`, `/api/articles/[...slug]`,
   `/api/programs`, `/api/skills`, `/api/keywords`, `/api/pipeline`,
   `/api/leads`, `/api/llms.txt`, `/api/squelette`, `/api/sante`.
9. **Footer sticky** (`mt-auto`) + disclosure d'affiliation + newsletter ;
   header sticky + navigation.
10. **Seuils planchers du contenu** : ≥ 10 articles publiés, ≥ 8 hébergeurs
    mesurés (24 lignes uptime, 24 latences, 8 tarifs).
11. **SSR par URL (correctif GEO, nov. 2026)** : l'état de navigation est lu
    côté serveur (`searchParams` → `initialNav` → store zustand fourni par
    `<NavProvider>`, créé AVEC l'état initial — jamais de mutation de store
    pendant le rendu). Le HTML servi pour `/?v=article&slug=…` EST celui de
    l'article : h1, contenu, `<link rel=canonical>`, `og:title`, `<title>`
    dédié, JSON-LD Article+FAQPage+BreadcrumbList rendus dans l'arbre JSX.
    Idem `?v=blog` et `?v=blog&silo=…` (vue filtrée). Le compteur de vues
    n'est PAS incrémenté au rendu serveur (`loadArticleDetail` partagé avec
    l'API, drapeau `incrementViews`). Chargeur unique :
    `src/lib/article-data.ts` (API et SSR alignés par construction).

## Force majeure — seul cas de modification d'une fonctionnalité existante

> « sauf en cas de force majeure pour l'implémentation d'une autre
> fonctionnalité qui nécessiterait la modification d'une fonctionnalité
> existante »

1. La nouvelle fonctionnalité exige **structurellement** de modifier l'existant :
   documenter POURQUOI (ci-dessous, journal daté).
2. Procédure : sentinelle VERTE **avant** → modification → sentinelle VERTE
   **après**.
3. Si un invariant doit légitimement changer (nouveau contenu, seuil différent) :
   `bun run baseline:update`, PUIS consigner le motif dans le journal
   ci-dessous, et committer.
4. Jamais de suppression silencieuse d'une fonctionnalité, jamais de seuil
   abaissé pour « faire passer » un rouge.

### Journal des force majeure

- **2026-11-24 — Audit profond & correctifs de finition (hydratation, liens
  internes crawlers, tableaux, touch targets)** : l'audit (scripts/audit-contenu.ts
  + navigateur headless + analyse visuelle) a révélé 2 bugs réels et plusieurs
  finitions. Modifiés : `promos-view.tsx` (compte à rebours : plus de
  `Date.now()` au rendu initial → l'erreur d'hydratation « serveur 15 / client
  16 » est éliminée, le timer affiche « ·· » un frame), `markdown.tsx`
  (liens internes : `<button>` → vraies `<a href="/?v=…">` cliquables ET lisibles
  par les crawlers/agents IA sans JS — le clic reste routé SPA), `globals.css`
  (tableaux d'articles : cellules repliables ≥ 768 px → plus de colonne
  « Prix (relevé le…) » coupée à droite ; nowrap conservé sur mobile avec
  défilement horizontal), `header.tsx` (« Promos BF » → « Promos »),
  `home-view.tsx` (barre de progression : 3 segments alignés sur « 1/3 »),
  `whatsapp-float.tsx` (masquage automatique quand le footer entre dans le
  viewport — ne recouvre plus le copyright), `blog-view.tsx` (chips de filtre
  à cible tactile 40 px), `serialize.ts` (`excerptFrom` : coupe propre, pas de
  « … » collé à une ponctuation — extraits DB recalculés), skill
  `humanisation-100/scripts/analyse_style.py` (les titres/blocs de code
  markdown ne sont plus comptés comme débuts de paragraphes — suppression
  d'un faux positif qui faussait le verdict vers « style IA détectable »).
  Sentinelle VERTE avant et après (62 contrôles, 0 alerte) ; aucun invariant
  modifié, aucune baseline changée.

- **2026-11-23 — SSR par URL (agents IA sans JavaScript)** : rendre chaque
  article/serveur lisible par les crawlers sans JS (GPTBot, PerplexityBot,
  ClaudeBot, moteurs classiques) exigeait structurellement de toucher la
  navigation et l'injection de données existantes. Fichiers modifiés :
  `src/lib/store.tsx` (store par requête via contexte — remplace le singleton
  module-level, supprime la fuite d'état inter-requêtes), `page.tsx`
  (lecture `searchParams` côté serveur, `generateMetadata` par article,
  `dynamic = "force-dynamic"`), `amens-app.tsx` (`NavProvider`),
  `article-view.tsx` (JSON-LD rendu dans l'arbre JSX au lieu d'une injection
  DOM `useEffect` invisible côté serveur), `api/articles/[...slug]`
  (délégation au chargeur partagé `lib/article-data.ts`). Sentinelle VERTE
  avant et après ; contrôles 5bis ajoutés (groupe `ssr-url`, 9 contrôles).
  Aucun comportement visible du visiteur modifié ; les paramètres d'URL
  appartenant à une autre vue (ex. `slug` en retournant au blog) sont
  désormais abandonnés (URLs propres, alignées sur canonique/sitemap).

## Rollback

État vert de référence : tag git **`stable-baseline`**.

```bash
git diff stable-baseline -- src/ scripts/ config/   # auditer les écarts
git checkout stable-baseline -- <chemins>           # restaurer des fichiers
bun run verify:regression                           # re-vérifier
```

Le tag `pre-sentinelle` conserve l'état vert antérieur à l'installation de la
sécurisation.

## Notes d'exécution

- Le serveur dev doit tourner sur le port 3000 (`bun run dev` en arrière-plan).
  `AMENS_BASE_URL` permet de cibler une autre base ; `AMENS_BROWSER_BIN` un
  autre binaire de navigateur headless.
- Ne JAMAIS lancer `bun run build` dans cet environnement.
- La sentinelle écrit `config/regression-last-run.json` à chaque passage :
  consulter ce fichier pour l'historique (ou la veille cron quotidienne).
