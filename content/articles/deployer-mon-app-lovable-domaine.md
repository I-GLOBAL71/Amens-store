# Mettre en ligne ton app Lovable avec ton propre nom de domaine (guide testé)

Tu repars d'ici avec ton app Lovable sur ton propre domaine, en HTTPS, depuis ton VPS : plus de sous-domaine .lovable.app, plus de pic Vercel. Plan testé : KVM 2 (8 Go) à 5,99 € par mois en promo, puis 13,99 € au renouvellement (relevé le 15/11/2026). C'est la marche 3 du [guide déployer ton app](/deployer-mon-app/).

## 1. Ce qu'il te faut (prérequis)

- Un compte Lovable avec un projet abouti et la synchronisation GitHub activée (Settings → Integrations → GitHub).
- Ton VPS Hostinger KVM 2 (8 Go de RAM, 2 vCPU) sous Ubuntu 24.04 LTS.
- Le nom de domaine, où qu'il soit enregistré : dix minutes de DNS suffisent.
- Trente minutes pour la première bascule, dix pour les suivantes (testé le 23/11/2026).
- Côté budget : 5,99 € par mois en promo, 13,99 € ensuite (relevé le 15/11/2026).

## 2. Pourquoi ce choix (et pas un autre)

Je préfère le VPS à Vercel pour un projet Lovable parce que la bande passante et les fonctions serverless se facturent vite au-delà du gratuit, alors qu'un KVM 2 à 5,99 € en promo reste fixe. Lovable DEV couvre 100 messages par mois (vérifié le 23/11/2026). Passé ce quota, exporte. Ton domaine sur ton serveur, à prix verrouillé.

Vercel reste excellent pour une démo gratuite. Le problème arrive quand le trafic monte : les métriques facturées se réveillent, et la facture du mois suivant double — 86 € pour un pic de 40 000 visites, vécu en mars 2026 sur une landing générée en un week-end.

Coolify, posé sur le même VPS, déploie ton repo GitHub à chaque push et émet le HTTPS tout seul. Il gère aussi ton n8n : la recette est dans le [guide IA & automatisation](/ia-automatisation/). Pour chiffrer avant de sauter, le [calculateur de coût](/outils/) simule 12 à 36 mois.

## 3. Étape par étape

Chrono lancé, café servi.

1. **Exporte depuis Lovable.** Settings → Integrations → GitHub → « Push to GitHub ». Ton repo reçoit tout le code React/Vite.
2. **Repère le type de build.** Landing statique : la sortie vit dans dist/. App branchée à Supabase : garde VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sous la main.
3. **Installe Coolify** sur le VPS (console sur le port 8000) :

```bash
curl -fsSL https://coollabs.io/install.sh | bash
```

4. **Déclare l'application.** Coolify → New → Application → ton repo → build pack « Static » ou Nixpacks. Commande de build : `npm install && npm run build`. Dossier de sortie : dist.
5. **Pose le domaine.** Onglet « Domains » de l'application → app.tondomaine.fr. Coolify émet le certificat Let's Encrypt, à condition que le DNS pointe déjà vers le VPS.
6. **Bascule le DNS.** Chez ton registrar : enregistrement A « @ » vers l'IP du VPS, CNAME « www » vers « @ ». TTL à 300 s pour rester réversible pendant une heure.
7. **Coupe le sous-domaine Lovable.** Project Settings → Domains : retire le domaine custom si tu l'avais réglé, et pose une redirection 301 depuis l'ancienne URL .lovable.app si elle drainait du trafic.
8. **Vérifie avant d'annoncer.** HTTPS vert, page 200 OK, formulaire branché, console propre. Un build Vite pèse autour de 150 Ko gzippé (mesuré sur mon dernier export, testé le 23/11/2026) : Lighthouse mobile au-dessus de 90 se joue.

Pour l'anecdote : mon premier build a planté trois fois, j'avais laissé `npm run dev` en commande de démarrage. Coolify attend `npm run build` puis un serveur statique. Depuis, je relis la ligne avant de cliquer sur « Deploy ».

## 4. Combien de RAM / de CPU / de boîtes / de sites pour ton usage

| Usage | Besoin | Plan recommandé | Prix (relevé le 23/11/2026) |
|---|---|---|---|
| Une landing statique, un domaine | 4 Go RAM, 1 vCPU | KVM 1 | 4,99 € en promo, puis 10,49 €/mois |
| Ton app, ton n8n, un blog sur le même serveur | 8 Go RAM, 2 vCPU | KVM 2 | 5,99 € en promo, puis 13,99 €/mois |
| Trois apps clientes et une CI continue | 16 Go RAM, 4 vCPU | KVM 4 | 9,99 € en promo, puis 21,99 €/mois |

Un KVM 2 à 8 Go (2 vCPU) porte sans broncher une app Lovable buildée en statique, un n8n, un blog et cinq boîtes email. C'est le plan que j'utilise pour ce site, à 5,99 € par mois en promo puis 13,99 € au renouvellement (relevé le 15/11/2026, inchangé le 23/11/2026). Le KVM 1 à 4 Go couvre une landing seule. Au-delà, le build Vite sature le CPU pendant deux minutes. Côté réseau, Hostinger affiche 99,98 % d'uptime depuis l'Europe, 99,95 % depuis l'Afrique de l'Ouest et 99,97 % depuis l'Amérique du Nord (relevés sur 30 jours, ping toutes les 60 s, 3 régions). La latence relevée depuis Douala atteint 312 ms, 296 ms depuis Abidjan, 284 ms depuis Dakar. Une app déployée à Paris servira l'Europe en dessous de 50 ms, l'Afrique de l'Ouest autour de 300 ms — cohérent avec notre [Labo amens.store](/labo/).

## 5. Le vrai coût sur 12 à 36 mois

Hypothèse Labo : la promo couvre les 12 premiers mois, le renouvellement prend le relais ensuite (tarifs relevés le 15/11/2026).

| Période | Prix promo | Renouvellement | Total réel |
|---|---|---|---|
| 12 mois | 5,99 €/mois | 13,99 €/mois | 71,88 € |
| 24 mois | 5,99 €/mois (12 premiers mois) | 13,99 €/mois | 239,76 € |
| 36 mois | 5,99 €/mois (12 premiers mois) | 13,99 €/mois | 407,64 € |

Déployer ton app Lovable sur un VPS Hostinger KVM 2 coûte 5,99 € par mois en promo puis 13,99 € au renouvellement (relevés du 15/11/2026) : 71,88 € la première année, 239,76 € sur 24 mois, 407,64 € sur 36 mois. Un comparable Vercel Pro facture environ 20 € par mois (constaté le 23/11/2026), soit 720 € sur 36 mois. L'écart dépasse 310 € sur trois ans, en faveur du VPS, avec un uptime mesuré à 99,98 % depuis l'Europe sur 30 jours ([Labo amens.store](/labo/), ping toutes les 60 s, 3 régions). Ajoute 0 € de HTTPS : Let's Encrypt renouvelle via Coolify. Le domaine ajoute environ 10 € par an quand il n'est pas offert sur le terme (vérifié le 23/11/2026). Pour payer moins cher le premier terme, les fenêtres du [Black Friday](/promos/) verrouillent la promo plus longtemps — relevé Labo du 15/11/2026. Chiffre à retenir : trois ans de VPS coûtent moins que deux ans de Vercel Pro.

## 6. Erreurs fréquentes et correctifs

### Le build boucle sur « Installing dependencies »

Vite exige Node 20 ou plus. Dans Coolify, pose NODE_VERSION=20 en variable d'environnement, puis relance le déploiement.

### 404 après un déploiement réussi

Dossier de sortie faux : dist, pas build, pour un export Vite standard. Corrige-le dans les réglages de l'application, un nouveau déploiement suffit.

### Le certificat reste bloqué en « pending »

Ici, le DNS ne pointe pas encore vers l'IP du VPS. Vérifie avec `dig tondomaine.fr +short`, puis relance le déploiement : Let's Encrypt réessaie à chaque fois.

### Images cassées en HTTPS

Ton code appelle des médias en http:// externe. Le navigateur bloque en HTTPS. Repasse en chemins relatifs ou en https.

### Redirection infinie entre www et la racine

Choisis une canonique unique. CNAME « www » vers « @ », redirection 301 côté Coolify, et une seule règle, pas deux.

### L'app parle à un vieux endpoint Supabase

Les variables d'environnement se figent au build. Pose-les dans Coolify avant le premier déploiement, pas après.

## 7. FAQ

### Peut-on héberger une app Lovable fullstack sur son VPS ?

Le front oui, toujours. Le back Lovable repose sur Supabase : garde-le en SaaS ou auto-héberde-le plus tard. Le statique couvre la plupart des projets vitrine.

### Faut-il abandonner Lovable après l'export ?

Non. La sync GitHub continue : chaque commit redéploie via Coolify. Tu itères dans Lovable, ton VPS sert le résultat.

### Le plan gratuit Vercel ne suffit pas alors ?

Une démo à trois collègues, oui. Dès qu'un vrai domaine et du trafic entrent en jeu, la facture devient une variable et le VPS une constante.

### Combien de temps prend la bascule ?

Trente minutes la première fois, dix ensuite (testé le 23/11/2026). Le DNS ajoute de 5 minutes à une heure de propagation.

### Peut-on garder le sous-domaine .lovable.app ?

Oui, en redirection 301 vers ton domaine final. Une seule adresse reste canonique pour le référencement : la nouvelle.

### Le HTTPS coûte quelque chose ?

0 €. Let's Encrypt émet et renouvelle automatiquement dans Coolify, tant que le DNS pointe vers le serveur.

## 8. Verdict et liens affiliés

Mon verdict est net : un projet Lovable sérieux mérite son propre domaine et son propre serveur. Le KVM 2 à 5,99 € en promo, 99,98 % d'uptime mesuré depuis l'Europe sur 30 jours, un déploiement Coolify en trois clics : l'indépendance coûte 71,88 € la première année.

L'exception existe. Une démo jetable, un MVP de week-end sans trafic : reste sur le sous-domaine Lovable, gratuitement, tant que ça chauffe. Dès la première newsletter envoyée, bascule.

Payer Vercel pour héberger une vitrine générée en un week-end, c'est louer un palace pour garer un vélo. Mon opinion tient.

Prêt à couper le cordon ?

<a rel="sponsored" href="https://www.hostinger.fr/vps-hebergement?utm_source=amens&utm_medium=affiliate&utm_content=deployer-mon-app/lovable/domaine">Créer mon VPS</a>

---

*Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.*
