# Héberger les sites de tes clients sans exploiter ta marge : le guide agence 2026

Tu repars avec le modèle pour héberger et facturer les sites WordPress de tes clients : serveur multi-sites, white-label et marge sur 10 clients. Plan recommandé : Cloudways DO 1 Go à 10,00 €/mois la première année, puis ~14 €/mois. Marge réelle : 2 064 €/an pour 10 clients (calcul du 15/11/2026). La suite vit dans le [guide agences](/agences/).

## 1. Ce qu'il te faut (prérequis)

- 10 sites clients, ou l'ambition d'y arriver.
- Un compte Cloudways et une carte en euros ou en dollars.
- Deux soirées pour migrer le premier serveur.
- Un moyen de facturation récurrente : abonnement Stripe ou facture mensuelle.
- Ton objectif écrit noir sur blanc : ici, 20 €/mois et par site client.

## 2. Pourquoi ce choix (et pas un autre)

Cloudways gagne le pari agence sur un chiffre : 10,00 €/mois pour un serveur DigitalOcean d'1 Go qui héberge 5 à 8 sites WordPress. Le white-label est inclus, les migrations passent sans coupure, tes clients se connectent sur un panneau à tes couleurs. Kinsta suit encore mieux, à 35,00 $/mois par site. La marge décide ensuite.

La logique multi-sites change l'économie de l'agence. Un serveur, 5 à 8 clients facturés 20 €/mois : le coût reste sous 15 %, la marge se renouvelle chaque mois, et le churn ne vient presque jamais de l'hébergement. Ma comptabilité, sur 10 clients : deux serveurs à 14 €/mois, 336 € de coûts annuels contre 2 400 € de facturation.

Une migration sans coupure suit une séquence précise : TTL baissé à 300 s 24 h avant, copie du site, test par fichier hosts, bascule DNS. Le [guide migration](/migrer/) la décompose clic par clic. Pour le passage de freelance à agence structurée, le [guide métiers](/metiers/) couvre les tarifs et les dossiers clients.

En juin dernier, j'ai migré 11 sites clients sur un week-end. Neuf sont passés sans hoquet. Le dixième, un WooCommerce de 2 Go d'images, m'a pris six heures — et la seule réclamation du client portait sur un favori périmé.

## 3. Étape par étape

1. **Crée le compte Cloudways**, choisis « DigitalOcean », serveur 1 Go, datacenter Paris ou Francfort.
2. **Déploie le premier WordPress** : « Applications » → « Ajouter » → WordPress. Note les identifiants admin, le site répond sur une URL temporaire.
3. **Héberge 5 à 8 clients par serveur** : une application par client. L'isolation au niveau applicatif limite les dégâts d'un site piraté.
4. **Migre un client existant** : extension Cloudways Migrator sur le WordPress d'origine, ou copie manuelle (fichiers + base). 24 h avant la bascule, baisse le TTL DNS à 300 s.
5. **Teste avant de basculer** : pointe ton fichier hosts vers la nouvelle IP, parcours le site, les formulaires, le paiement. Bascule le DNS seulement ensuite.
6. **Active le white-label** : dans les réglages du compte, remplace le logo Cloudways et l'expéditeur par ceux de ton agence. Tes clients voient ta marque, pas celle de l'hébergeur.
7. **Facture 20 €/mois par site** : ligne « Hébergement et maintenance » sur la facture, ou abonnement Stripe. Le client paie un service, pas un serveur.
8. **Ouvre le second serveur au 9e client.** La capacité reste en réserve, les risques se répartissent.

## 4. Combien de RAM / de boîtes / de sites pour ton usage

| Usage | Besoin | Plan recommandé | Prix (relevé le 23/11/2026) |
|---|---|---|---|
| Démarrage, ≤ 5 vitrines | 100 sites, mutualisé | Hostinger Premium | 2,49 €/mois |
| Petit parc francophone | sites illimités, cPanel | o2switch Unique | 5,00 €/mois |
| 5 à 8 clients WordPress | 1 Go RAM, isolation | Cloudways DO 1 Go | 10,00 €/mois |
| Client e-commerce exigeant | support N+, APM | Kinsta Starter | 35,00 $/mois |

Un serveur d'1 Go héberge confortablement 5 à 8 petits sites WordPress. Pas 15 : j'ai essayé ma première année, la mémoire PHP-FPM sature dès les vendredis de mises à jour. Une application par client, alors : l'isolation évite qu'un site piraté contamine les autres. À 10,00 €/mois par serveur (relevé le 23/11/2026), une machine à 6 clients facturés 20 €/mois dégage 120 € de revenus pour 10 € de coût. Au-delà de 8 sites, ouvre un second serveur plutôt que de monter en gamme : deux machines d'1 Go répartissent le risque mieux qu'une seule de 2 Go, à capacité équivalente. Garde Kinsta Starter (35,00 $/mois) pour le client e-commerce qui paie le support N+, l'APM et les sauvegardes. Le reste du parc vit très bien sur Cloudways. Moi, j'ai commencé avec une machine et 4 clients à 20 €/mois : le serveur s'est payé le premier mois.

## 5. Le vrai coût sur 12 à 36 mois

| Période | Prix promo | Renouvellement | Total réel |
|---|---|---|---|
| 12 mois, 1 serveur | 10,00 €/mois | ~14 €/mois dès le 13e mois | 120,00 € |
| 24 mois, 1 serveur | 10,00 €/mois | ~14 €/mois dès le 13e mois | 288,00 € |
| 36 mois, 1 serveur | 10,00 €/mois | ~14 €/mois dès le 13e mois | 456,00 € |

Cloudways DO 1 Go, relevé le 15/11/2026 : 10,00 €/mois la première année, renouvellement 14,00 $/mois, compté ici à ~14 €. Sur 36 mois et 10 clients sur deux serveurs : 912,00 € de coûts pour 7 200,00 € facturés, soit 6 288,00 € de marge brute. En comptant une heure par mois et par serveur de maintenance, la marge ressort à 87 € de l'heure. Kinsta Starter joue ailleurs : 35,00 $/mois à tarif plat, renouvellement identique, mais 1 260,00 $ sur 36 mois pour un seul site. Le [Labo amens.store](/labo/) mesure les deux toutes les 60 s : 99,97 % de dispo chez Cloudways contre 99,99 % chez Kinsta, 346 ms depuis Douala contre 334 ms. Il suit les programmes partenaires : 30 $ + 7 % lifetime chez Cloudways (cookie 90 jours), 50 à 500 $ + 10 % récurrent chez Kinsta (cookie 60 jours). Revendre à prix coûtant, c'est travailler gratuitement le dimanche soir.

## 6. Erreurs fréquentes et correctifs

- **Revendre l'hébergement à prix coûtant.** « Inclus dans le site » rime avec « gratuit chaque dimanche soir ». Une ligne à 20 €/mois, dès le premier mois.
- **Empiler 10 clients sur un seul serveur d'1 Go.** Au-delà de 8 sites, la mémoire sature les vendredis de forte charge. Deux petites machines plutôt qu'une grosse.
- **Laisser le serveur au nom du client.** Litiges de paiement, renouvellements surprises, comptes non transférables. Le serveur appartient à l'agence, le service au client.
- **Ne pas baisser le TTL DNS avant une migration.** Un TTL de 24 h fait 24 h de trafic coupé en deux. Passe-le à 300 s la veille de la bascule.
- **Sauter le test par fichier hosts.** Le tunnel de commande qui plante après la bascule, c'est le client qui le découvre. Teste d'abord, bascule ensuite.
- **Oublier la clause de sortie dans le contrat.** Deux paragraphes fixent le prix de l'hébergement et les conditions de restitution. Écris-les avant le premier litige.

## 7. FAQ

### Combien facturer l'hébergement à un client ?
La règle courante : le double du coût. Une part de serveur à 14 €/mois se facture autour de 20 €/mois support compris, soit 6 € de marge brute par site.

### Peut-on mettre le logo de ton agence sur le panneau Cloudways ?
Oui : le white-label remplace la marque de l'hébergeur par la tienne. Tes clients voient ton agence, pas Cloudways.

### Cloudways ou Kinsta pour une agence ?
Cloudways pour le parc multi-clients : 456,00 € sur 36 mois par serveur. Kinsta pour le client premium : 1 260,00 $ par site sur la même période, support N+ compris.

### Qu'est-ce qu'une migration sans downtime ?
Une séquence : TTL à 300 s, copie du site, test par fichier hosts, bascule DNS. Le client ne voit rien, sauf un site plus rapide.

### La marge sur l'hébergement vaut-elle le coup en 2026 ?
2 064 € par an pour 10 clients, récurrents, avant même les contrats de maintenance. Elle se renouvelle quasi seule tant que les sites restent stables.

### Peut-on cumuler affiliation et revente ?
Oui : un programme partenaire se cumule avec la marge, 30 $ + 7 % lifetime chez Cloudways par exemple. Déclare le lien d'affiliation à ton client, c'est plus sain.

### Par quel serveur commencer avant le premier client ?
Une machine d'1 Go à 10,00 €/mois. Remplis-la jusqu'à 5 clients, puis ouvre la deuxième : la capacité se paie au fur et à mesure.

## 8. Verdict et liens affiliés

Le calcul ne ment pas : héberger 10 clients sur deux serveurs Cloudways coûte 912,00 € sur 36 mois, pour 7 200,00 € facturés. Ça fait 6 288,00 € de marge brute, sans une ligne de code au-delà de ce que tu écris déjà.

Ma règle : la ligne « hébergement » est la première ligne récurrente d'une agence. Elle finance les mois creux, elle ne se brade jamais.

Kinsta reste pour les clients e-commerce exigeants, ceux qui appellent le vendredi soir. Pour le reste du parc, Cloudways offre le meilleur rapport marge/risque que j'ai mesuré cette année.

<a rel="sponsored" href="https://www.cloudways.com/?utm_source=amens&utm_medium=affiliate&utm_content=agences/marge">Calculer ma marge d'agence</a>

---

*Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.*
