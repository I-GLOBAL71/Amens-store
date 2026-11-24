# Quitter Hostinger sans rien perdre : migration pas à pas (guide testé)

Tu repars d'ici avec un plan de sortie propre : sauvegarde intégrale, migration WordPress vers Cloudways, bascule DNS, résiliation seulement après vérification. Ma destination testée : Cloudways DO 1 Go à 10,00 € en promo puis 14,00 $ au renouvellement (relevé le 15/11/2026), migration incluse. C'est le chapitre 2 du [guide migrer](/migrer/).

## 1. Ce qu'il te faut (prérequis)

- Un compte Hostinger actif, idéalement à plus de 30 jours de l'échéance : la fenêtre calme.
- Ton compte Cloudways créé, serveur DO 1 Go lancé (essai sans carte, vérifié le 23/11/2026).
- L'accès DNS de ton domaine, où qu'il soit enregistré.
- Quarante-cinq minutes pour un site, une heure pour trois.
- UpdraftPlus installé côté WordPress, ou rsync si tu aimes la ligne de commande.

## 2. Pourquoi ce choix (et pas un autre)

Je dirige les déçus de Hostinger vers Cloudways parce que la migration y est gratuite et gérée par leur équipe, et que le panneau reste lisible pour un non-sysadmin. Le DO 1 Go passe de 10,00 € à 14,00 $ au renouvellement (relevé le 15/11/2026) : plus cher qu'un mutualisé, certes. Tu rends la gestion serveur à quelqu'un d'autre.

Les alternatives tiennent en deux phrases. o2switch facture son Unique 5,00 € en promo puis 7,00 € (relevé du 15/11/2026), avec l'uptime le plus haut de notre panel : 99,99 % en Europe, 99,96 % depuis l'Afrique de l'Ouest. Sa latence mesurée depuis Douala tombe à 214 ms, contre 346 ms pour Cloudways — si ton public vit en Afrique de l'Ouest, le calcul change. Kinsta vise l'agence premium, facturation en dollars : budget différent.

Pour arbitrer chiffres en main, le [comparateur d'outils](/outils/) trie par renouvellement réel. Si la migration casse quelque chose un samedi soir, le silo [pannes](/pannes/) décrit les restaurations de secours.

## 3. Étape par étape

Feuille de route en neuf gestes.

1. **Fais l'inventaire.** Sites, bases, thèmes, plugins, boîtes email. Les adresses mail sont le grand oublié des migrations : note-les toutes.
2. **Sauvegarde tout, deux fois.** hPanel → Fichiers → Sauvegardes → télécharger l'archive, et UpdraftPlus pour fichiers plus base. En ligne de commande, l'équivalent :

```bash
mysqldump -h localhost -u user -p mabase > mabase.sql
tar czf site.tar.gz public_html
```

3. **Exporte les emails.** Thunderbird en IMAP → glisser les dossiers en local, format .mbox conservé. La recette détaillée vit dans le silo [email pro](/email-pro/).
4. **Lance la migration Cloudways.** Depuis ton WordPress : plugin « Cloudways Automated Migration » → URL du site, clé API Cloudways → « Start Migration ». Compte 20 minutes pour 2 Go (observé, testé le 23/11/2026).
5. **Teste sur l'URL temporaire.** Cloudways en fournit une du type abc123.cloudwaysapps.com : pages, permaliens, formulaires, panier WooCommerce, images. Tout, avant la bascule.
6. **Baisse le TTL DNS la veille.** 300 s au lieu de 24 h. J'ai appris ça en touchant un TTL long : le site est resté mi-ici mi-là-bas pendant 22 heures, un jeudi. Passe le TTL, puis dors.
7. **Bascule le DNS.** Enregistrement A vers l'IP Cloudways, « www » en CNAME vers « @ ». Attends la propagation, puis émets le SSL Let's Encrypt depuis Cloudways, en un clic.
8. **Observe sept jours.** Uptime, 404 dans Search Console, formulaires qui partent. L'ancien hébergeur reste en ligne, éteint, prêt à servir.
9. **Résilie enfin.** hPanel → Gérer le compte → Résiliation. Télécharge les archives de sauvegarde avant la date de coupure. Si ton domaine est enregistré chez Hostinger, garde-le gérable ou transfère-le : une fenêtre de 60 jours s'applique après un transfert (règle ICANN usuelle).

## 4. Combien de RAM / de CPU / de boîtes / de sites pour ton usage

| Usage | Besoin | Plan recommandé | Prix (relevé le 23/11/2026) |
|---|---|---|---|
| Un site vitrine, 10 000 visites/mois | 1 Go de RAM, 1 vCPU | Cloudways DO 1 Go | 10,00 € promo, puis 14,00 $/mois |
| Trois sites, WooCommerce léger | 2 Go de RAM, 2 vCPU | Cloudways DO 2 Go | 22,00 $ promo, puis 26,00 $/mois |
| Refus total de la ligne de commande | Tout géré, clé en main | o2switch Unique | 5,00 € promo, puis 7,00 €/mois |
| Agence, dix sites, staging | 4 Go de RAM, 2 vCPU | Cloudways DO 4 Go | 41,00 $ promo, puis 48,00 $/mois |

Cloudways DO 1 Go absorbe un site vitrine à 10 000 visites par mois sans transpirer, à 10,00 € par mois en promo puis 14,00 $ au renouvellement (relevé le 15/11/2026, inchangé le 23/11/2026). L'uptime mesuré atteint 99,97 % depuis l'Europe, 99,94 % depuis l'Afrique de l'Ouest et 99,96 % depuis l'Amérique du Nord, sur 30 jours, ping toutes les 60 s, 3 régions ([Labo amens.store](/labo/)). La latence relevée atteint 346 ms depuis Douala, 322 ms depuis Abidjan, 310 ms depuis Dakar. o2switch Unique, à 5,00 € puis 7,00 € par mois (relevé du 15/11/2026), fait mieux sur les deux tableaux : 99,99 % d'uptime en Europe et 214 ms depuis Douala. Trois sites et un WooCommerce léger demanderont 2 Go de RAM, environ 26,00 $ par mois au renouvellement (relevé le 23/11/2026). Une agence gérant dix sites visera 4 Go et un staging, vers 48,00 $ par mois (relevé le 23/11/2026).

## 5. Le vrai coût sur 12 à 36 mois

Hypothèse Labo : la promo couvre les 12 premiers mois ; dollars convertis au taux du relevé, 1 € = 1,08 $ (15/11/2026), soit 14,00 $ ≈ 12,96 € par mois.

| Période | Prix promo | Renouvellement | Total réel |
|---|---|---|---|
| 12 mois | 10,00 €/mois | 14,00 $/mois | 120,00 € |
| 24 mois | 10,00 €/mois (12 premiers mois) | 14,00 $/mois | 275,52 € |
| 36 mois | 10,00 €/mois (12 premiers mois) | 14,00 $/mois | 431,04 € |

Rester chez Hostinger Premium sur 36 mois coûte 221,64 € (2,49 € puis 7,99 € par mois, relevé du 15/11/2026). Partir vers Cloudways DO 1 Go, migration incluse, revient à 120,00 € la première année, puis 155,52 € les douze mois suivants (14,00 $ ≈ 12,96 € au taux du relevé : 1 € = 1,08 $). Total : 431,04 € sur 36 mois. La prime de sortie avoisine 210 € sur trois ans contre le mutualisé d'origine. En échange, l'uptime Cloudways mesuré atteint 99,97 % en Europe contre 99,98 % pour Hostinger, sur 30 jours, ping toutes les 60 s, 3 régions ([Labo amens.store](/labo/)). La latence relevée depuis Douala atteint 346 ms pour Cloudways contre 312 ms pour Hostinger. o2switch Unique boucle le trio à 228,00 € sur 36 mois (5,00 € puis 7,00 €, relevé du 15/11/2026), avec 214 ms depuis Douala. Chiffre à retenir : 210 € de plus sur trois ans pour ne plus gérer de serveur.

## 6. Erreurs fréquentes et correctifs

### Résilier avant la bascule

Classique. Le nouveau site casse un vendredi, plus rien derrière. Garde Hostinger vivant sept jours après la bascule DNS.

### Migrer la base sans le dossier upload

Tes articles arrivent, tes images non. Fichiers et base font la paire : vérifie le poids de wp-content/uploads avant de crier victoire.

### Oublier les boîtes email

Elles ne migrent pas toutes seules. Exporte en IMAP avant, recrée côté nouveau : le silence des emails perdus coûte des clients.

### Les permaliens retournent des 404

Règle « Réglages → Permaliens → Enregistrer » deux fois sur le nouveau WordPress : le .htaccess se régénère.

### Mixed content après le HTTPS

Des URLs http traînent dans la base. Better Search Replace, domaine par domaine, et le cadenas verdira.

### TTL DNS resté à 24 h pendant la bascule

Deux adresses cohabitent alors pendant une journée. Baisse le TTL à 300 s la veille, point final.

## 7. FAQ

### La migration Cloudways coûte combien ?

0 € : le plugin ou l'équipe dédiée s'en chargent, serveur compris dans l'offre (vérifié le 23/11/2026). Tu paies l'hébergement, rien d'autre.

### Peut-on migrer un site sans WordPress ?

Oui : fichiers via SFTP ou rsync, base via mysqldump, DNS à la main. Le plugin automatique ne concerne que WordPress.

### Le référencement survit-il ?

Si les URLs restent identiques, oui. Surveille les 404 dans Search Console pendant deux semaines, redirige à la volée sinon.

### Les emails suivent-ils ?

Pas automatiquement. Exporte en IMAP, recrée les boîtes, bascule les MX après les sites : l'ordre compte.

### Faut-il attendre la fin de l'abonnement Hostinger ?

Non. Bascule quand tu veux, résilie après vérification. Hors fenêtre de remboursement, l'abonnement payé court jusqu'au terme.

### o2switch ou Kinsta, plutôt ?

o2switch si le budget compte (5,00 € puis 7,00 €, relevé du 15/11/2026) et si la latence Afrique de l'Ouest importe : 214 ms mesurés depuis Douala. Kinsta pour une agence au portefeuille large.

## 8. Verdict et liens affiliés

Mon verdict est calme : si tu quittes Hostinger pour la facture, vérifie d'abord la colonne renouvellement — parfois rester 24 mois en promo coûte moins qu'un départ précipité. Si tu pars pour le service ou la sérénité, Cloudways et sa migration gratuite offrent la sortie la moins risquée du panel testé.

Un principe pour finir, opinion assumée : résilier le jour de la migration, c'est sauter sans parachute. La règle des sept jours ne se négocie pas, et l'ancien compte reste ta meilleure sauvegarde pendant toute la bascule.

Prêt à partir proprement ?

<a rel="sponsored" href="https://www.cloudways.com/?utm_source=amens&utm_medium=affiliate&utm_content=migrer/hostinger">Migrer gratuitement avec Cloudways</a>

---

*Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.*
