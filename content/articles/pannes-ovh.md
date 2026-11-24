# OVH en panne : que faire (et comment vérifier que c'est bien ton hébergeur)

Tu repars avec la méthode de diagnostic en 5 minutes (OVH en panne ou problème chez toi), le statut en direct et le réflexe qui ne casse rien. Plan recommandé : si l'incident est confirmé, prépare la migration vers o2switch (5,00 €/mois, renouvellement 7,00 €/mois, relevé le 15/11/2026) après sauvegarde. La suite vit dans le [guide pannes](/pannes/).

## 1. Ce qu'il te faut (prérequis)

- 10 minutes, un téléphone en 4G et ta connexion habituelle.
- Un terminal : PowerShell sur Windows, Terminal sur macOS.
- Tes identifiants OVH, au cas où le diagnostic pointe chez toi.
- La page de statut OVH en favori (mets-la avant le prochain incident).
- Une sauvegarde récente du site : fichiers et base. Sinon, c'est la première chose à faire.

## 2. Pourquoi ce choix (et pas un autre)

o2switch gagne le rôle d'alternative parce qu'il cumule les plus basses latences du panel — 214 ms depuis Douala, 196 ms depuis Abidjan, 182 ms depuis Dakar — et 99,99 % de dispo en Europe sur 30 jours (ping toutes les 60 s, 3 régions). Leur équipe prend en charge les migrations WordPress gratuitement.

Sur la même fenêtre, OVH affiche 99,92 % de dispo en Europe, 99,88 % depuis l'Afrique de l'Ouest, 99,90 % depuis l'Amérique du Nord. Rien de dramatique : environ 34 min de coupure par mois en Europe, 52 min vues d'Afrique de l'Ouest. Sauf que le jour où ta boutique est down, ces minutes-là sont des euros.

o2switch Unique coûte 5,00 €/mois la première année, renouvellement 7,00 €/mois (relevé le 15/11/2026). Sur le papier, OVH Perso reste moins cher la première année à 3,60 €/mois. Mon avis : l'économie ne couvre pas les mardis soirs passés à contempler une page de statut. Pour la sortie propre, [migrer ton site](/migrer/) suit une procédure précise, et [les bons outils](/outils/) surveillent ta dispo pendant que tu attends.

## 3. Étape par étape

En mars dernier, j'ai perdu 50 minutes là-dessus. Site injoignable, premier réflexe : redémarrer la box, vider les caches, maudire le Wi-Fi. La page de statut OVH affichait un incident ouvert depuis 40 minutes. La méthode ci-dessous s'exécute dans l'ordre, chaque étape élimine un suspect.

1. **Recharge en navigation privée** (Ctrl+Shift+N). Toujours rien ? Continue.
2. **Teste en 4G, Wi-Fi coupé** : si le site charge sur les données mobiles, le problème est ta connexion, ta box ou le cache DNS de ta machine.
3. **Force le rafraîchissement** : Ctrl+F5 (Windows) ou Cmd+Shift+R (macOS). Un cache fatigué affiche un site « en panne » des heures après la réparation.
4. **Ouvre la page de statut OVH** : tape « statut OVH » dans ton moteur de recherche, la page officielle liste les incidents datacenter par datacenter (RBX, GRA, SBG). Bandeau rouge : coupable désigné.
5. **Confirme au terminal** : `ping tondomaine.fr` puis `traceroute tondomaine.fr` (`tracert` sous Windows). Si la trace meurt sur un hop OVH, l'incident est chez eux, pas chez toi.
6. **Croise la courbe des signalements** sur Downdetector : un pic de rapports « OVH » dans l'heure confirme la tendance mieux que trois tweets isolés.
7. **Exporte tout, tout de suite** : fichiers par FTP, base via phpMyAdmin si ça répond encore. Un incident réseau ne touche pas d'ordinaire aux disques ; ne parie pas dessus.
8. **Regarde la migration seulement ensuite.** L'équipe o2switch reprend un site WordPress gratuitement ; ton unique tâche reste le switch DNS à la fin.

Règle d'or : la sauvegarde se prend avant la migration. Toujours.

## 4. Combien de RAM / de boîtes / de sites pour ton usage

| Usage | Besoin | Plan recommandé | Prix (relevé le 23/11/2026) |
|---|---|---|---|
| 1 à 5 sites WordPress | sites illimités, cPanel | o2switch Unique | 5,00 €/mois |
| Site client sous trafic | 1 Go RAM, scaling vertical | Cloudways DO 1 Go | 10,00 €/mois |
| Vitrine + email pro | 100 sites, 1 boîte | Hostinger Premium | 2,49 €/mois |
| Sortie budget mini | 1 site, 20 Go | Infomaniak Éco | 3,90 €/mois |

Quand OVH vacille, o2switch Unique est mon premier repli : 5,00 €/mois pour des sites illimités, cPanel, LiteSpeed et un support basé à Clermont-Ferrand. Renouvellement à 7,00 €/mois, l'écart le plus resserré que je suive. Pour un site client sous charge, Cloudways DO 1 Go (10,00 €/mois) fournit un serveur cloud isolé, scalable à la verticale sans toucher une ligne de commande. Hostinger Premium à 2,49 €/mois convient à un vitrine qui doit être en ligne dès ce soir. Infomaniak Éco à 3,90 €/mois est la sortie minimaliste (renouvellement 6,90 €/mois, relevé le 15/11/2026). Surtout, la dispo mesurée par le Labo sur 30 jours, ping toutes les 60 s depuis 3 régions : OVH à 99,92 % (Europe), 99,88 % (Afrique de l'Ouest), 99,90 % (Amérique du Nord) ; o2switch à 99,99/99,96/99,98 %. En minutes par mois, cela fait environ 52 min de coupure côté OVH contre 17 min côté o2switch, vus d'Afrique de l'Ouest.

## 5. Le vrai coût sur 12 à 36 mois

| Période | Prix promo | Renouvellement | Total réel |
|---|---|---|---|
| 12 mois, o2switch | 5,00 €/mois | 7,00 €/mois dès le 13e mois | 60,00 € |
| 24 mois, o2switch | 5,00 €/mois | 7,00 €/mois dès le 13e mois | 144,00 € |
| 36 mois, o2switch | 5,00 €/mois | 7,00 €/mois dès le 13e mois | 228,00 € |

Passer chez o2switch Unique après une panne coûte, relevé le 15/11/2026 : 5,00 €/mois la première année (60,00 €), puis 7,00 €/mois (84,00 €/an), soit 228,00 € sur 36 mois. La migration elle-même est gratuite : leur équipe reprend le site WordPress, fichiers et base compris, sans que tu touches un client FTP. Rester sur OVH Perso aurait coûté 216,00 € sur la même période (3,60 €/mois la première année, puis 7,20 €/mois). OVH reste donc moins cher sur le papier, de 12,00 € sur 3 ans. Ce que ces 12,00 € n'achètent pas, d'après les mesures du [Labo amens.store](/labo/) : 99,96 % de dispo vue d'Afrique de l'Ouest contre 99,88 %, soit environ 17 min de coupure par mois contre 52 min. La latence donne le même verdict : 214 ms depuis Douala, 196 ms depuis Abidjan, 182 ms depuis Dakar. Ma règle après un incident : sauvegarde d'abord, switch ensuite.

## 6. Erreurs fréquentes et correctifs

- **Migrer pendant l'incident, sans sauvegarde.** Erreur numéro un. Si la migration échoue, l'export restant devient ton seul exemplaire.
- **Tester uniquement depuis ton Wi-Fi.** Une fibre coupée ressemble à s'y méprendre à une panne OVH. Teste en 4G avant d'accuser l'hébergeur.
- **Redémarrer la box trois fois.** Quinze minutes perdues. La page de statut répond en 30 secondes.
- **Croire le cache.** Le site « toujours down » deux heures après la réparation : Ctrl+F5, puis vide le cache du navigateur.
- **Supprimer le serveur OVH sous le coup de la colère.** L'incident prend fin, les données ne reviennent pas. Exporte d'abord, décide ensuite.
- **Ouvrir un ticket urgent pendant que le statut est rouge.** Tu rejoins une file de centaines de tickets ; la page de statut et les réseaux sociaux confirment déjà tout.

## 7. FAQ

### Comment savoir si OVH est en panne ?
La méthode en 5 minutes : navigation privée, test 4G, page de statut, puis ping et traceroute. Le coupable est identifié en quatre étapes.

### Où voir le statut OVH en direct ?
Sur la page de statut officielle OVH, et sur le tableau Labo amens.store, qui re-ping OVH toutes les 60 s depuis 3 régions.

### OVH tombe-t-il plus souvent que les autres ?
D'après la fenêtre de 30 jours mesurée : 99,88 % de dispo depuis l'Afrique de l'Ouest, contre 99,96 % chez o2switch. L'écart existe, il reste mesuré.

### Faut-il migrer pendant la panne ?
Non. Sauvegarde d'abord, migration une fois l'incident refermé. Une migration faite en panique rate plus souvent qu'une migration tranquille, j'ai vu les deux.

### La migration chez o2switch est-elle vraiment gratuite ?
Oui : leur équipe reprend le site WordPress, fichiers et base. Il te reste le switch DNS à la fin, cinq minutes.

### OVH dédommage-t-il des pannes ?
Certains incidents ouvrent droit à des crédits de service, selon les engagements contractuels. Lis les conditions avant de réclamer.

### Mon site est down mais mes emails partent. Est-ce quand même l'hébergeur ?
Oui, c'est possible : le web et la messagerie ne partagent pas toujours la même infrastructure. La page de statut distingue les services touchés.

## 8. Verdict et liens affiliés

Mon verdict : une panne OVH ne justifie presque jamais une migration impulsive. Aucun incident ne justifie de migrer sans sauvegarde, aucun. La bonne séquence tient en trois gestes : diagnostiquer (5 minutes), exporter (30 minutes), décider tranquille.

Si la dispo d'OVH ne te convient plus, o2switch est l'alternative que les mesures du Labo placent en tête côté latences et dispo vue d'Afrique de l'Ouest, et leur équipe gère la migration gratuitement. 228,00 € sur 3 ans contre 216,00 € chez OVH : l'écart ne paie même pas un soir de panne.

Entre-temps, je garde le réflexe export, même par temps calme.

<a rel="sponsored" href="https://www.o2switch.fr/?utm_source=amens&utm_medium=affiliate&utm_content=pannes/ovh">Voir l'alternative immédiate</a>

---

*Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.*
