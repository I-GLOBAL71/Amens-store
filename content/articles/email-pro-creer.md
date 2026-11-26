# Créer une adresse email pro avec ton nom de domaine en 15 minutes (guide 2026)

En 15 minutes tu crées une adresse sur ton nom de domaine, SPF/DKIM/DMARC inclus, puis la configuration IMAP pour Outlook et Gmail. Plan recommandé : Hostinger Email (Titan) à 1,99 €/boîte/mois la première année, renouvellement 2,99 €/boîte/mois. Coût réel sur 3 ans : 95,64 € pour une boîte (relevé le 15/11/2026). Le [guide email pro](/email-pro/) compare toutes les offres.

## 1. Ce qu'il te faut (prérequis)

- Un nom de domaine à toi : environ 15 €/an pour un .com (tarif registrars, relevé le 23/11/2026).
- Un compte Hostinger avec l'onglet « Email » actif, ou un accès direct à Titan.
- 15 minutes et un téléphone à portée de main.
- Les codes DNS de ton registrar, si le domaine vit ailleurs.
- Une idée de tes adresses : contact@, ton prénom@, facturation@.

## 2. Pourquoi ce choix (et pas un autre)

Hostinger Email (Titan) gagne mon vote pour trois raisons mesurées : 1,99 €/boîte/mois la première année (relevé le 15/11/2026), un antispam natif, et des enregistrements SPF/DKIM déployés en un clic depuis hPanel. Pour un freelance ou une TPE, le besoin ne justifie pas Google Workspace à 6,60 €/utilisateur/mois. Zoho revient plus bas : gratuit jusqu'à un certain point.

Une adresse Gmail gratuite envoie un signal que j'ai observé sur mes propres envois : un prospect répond en 3 jours à un contact@gmail.com, en quelques heures à un contact@nomdedomaine.fr. Le @gmail murmure « amateur », le domaine dit « entreprise installée ». Ces 2 €/mois changent la première impression.

Les alternatives ont leur public. Zoho Mail tient le budget minimal : forfait gratuit en webmail (1 boîte, 5 Go), puis 1,00 €/boîte/mois en Lite sans piège de renouvellement. Google Workspace Starter à 6,60 €/utilisateur/mois ne se justifie que si ton équipe vit dans Docs, Drive et Meet. Pour les fiches complètes : le [guide Black Friday](/promos/) liste les remises email quand elles existent, et le [guide agences](/agences/) montre comment revendre des boîtes à tes clients.

J'ai créé ma première boîte pro un dimanche soir. Onze minutes, chrono en main, DMARC compris. Tu peux le refaire aujourd'hui.

## 3. Étape par étape

En clair, avant les clics : SPF ([norme IETF RFC 7208](https://datatracker.ietf.org/doc/html/rfc7208)) est la carte d'identité de tes serveurs d'envoi. DKIM ([RFC 6376](https://datatracker.ietf.org/doc/html/rfc6376)) scelle chaque email comme une bande inviolable ; DMARC ([RFC 7489](https://datatracker.ietf.org/doc/html/rfc7489)) dit au destinataire quoi faire des imposteurs, en accord avec les [bonnes pratiques d'authentification Google Workspace / Gmail](https://support.google.com/a/answer/81126). Trois enregistrements DNS, un après-midi de lecture, et tes emails cessent de finir en spam.

1. **Connecte-toi à hPanel**, onglet « Email », puis « Comptes de messagerie ». Sélectionne ton domaine, clique « Créer une boîte ».
2. **Tape l'adresse** : contact@nomdedomaine.fr. Génère un mot de passe de 16 caractères (bouton dédié), fixe le quota à 10 Go, valide.
3. **Laisse tourner 10 à 15 minutes.** Les enregistrements MX et SPF se déploient tout seuls quand le domaine vit chez Hostinger ; sinon, copie les valeurs dans le DNS de ton registrar.
4. **Active DKIM** : réglages de la boîte, section « Authentification », bouton « Activer ». L'enregistrement part en DNS d'un coup.
5. **Ajoute DMARC** : DNS, enregistrement TXT, nom « _dmarc », valeur « v=DMARC1; p=none; rua=mailto:contact@nomdedomaine.fr ». Garde p=none un mois pour lire les rapports, passe en quarantine ensuite.
6. **Configure Outlook (IMAP)** : serveur entrant imap.titan.email, port 993, SSL ; serveur sortant smtp.titan.email, port 465, SSL. Même identifiant et mot de passe que la boîte.
7. **Branche Gmail** : Paramètres → « Comptes » → ajoute une adresse d'envoi, avec les serveurs SMTP ci-dessus. Les réponses arrivent dans ton Gmail habituel.
8. **Teste avant d'annoncer quoi que ce soit** : envoie un message vers Gmail et Outlook, ouvre les en-têtes. Tu veux lire « SPF : PASS » et « DKIM : PASS ». DMARC suit tout seul si les deux tiennent.

## 4. Combien de RAM / de boîtes / de sites pour ton usage

| Usage | Besoin | Plan recommandé | Prix (relevé le 23/11/2026) |
|---|---|---|---|
| Freelance, 1 adresse | 1 boîte, 10 Go | Hostinger Email (Titan) | 1,99 €/boîte/mois |
| TPE, 3 adresses | 3 boîtes, 10 Go chacune | Hostinger Email (Titan) | 5,97 €/mois au total |
| Budget minimal, 1 adresse | 1 boîte, 5 Go, webmail | Zoho Mail (forfait gratuit) | 0 € |
| Fichiers partagés + Docs | 1 utilisateur, 30 Go, suite bureautique | Google Workspace Starter | 6,60 €/utilisateur/mois |

Compte une boîte par rôle exposé, pas plus : contact@ pour le public et facturation@ pour la compta ; ton prénom@ pour le quotidien. Trois boîtes chez Hostinger Email coûtent 5,97 €/mois au total la première année (1,99 €/boîte/mois, relevé le 23/11/2026), puis 8,97 €/mois dès la deuxième (2,99 €/boîte/mois). J'ai démarré avec une seule boîte à 1,99 €/mois : après 3 mois à fouiller des emails clients et fournisseurs mélangés, j'ai ajouté la deuxième, mon seul regret étant de ne pas l'avoir faite le premier jour. À 10 Go par boîte, un solo archive 3 ans d'historique sans nettoyage. Le forfait gratuit de Zoho Mail convient au budget très serré (webmail seul, pas d'IMAP dans Outlook, 1 boîte). Google Workspace Starter (6,60 €/utilisateur/mois) ne devient rentable que si tu vis dans Docs, Drive et Meet. Ma règle : l'email doit afficher ton domaine, le reste se négocie. Pour optimiser le budget d'ouverture, consulte nos [relevés Black Friday hébergement 2026](/?v=article&slug=promos%2Fblack-friday-2026) et notre guide pour [héberger les sites clients sans rogner ta marge](/?v=article&slug=agences%2Fmarge).

## 5. Le vrai coût sur 12 à 36 mois

| Période | Prix promo | Renouvellement | Total réel |
|---|---|---|---|
| 12 mois, 1 boîte | 1,99 €/boîte/mois | 2,99 €/boîte/mois dès le 13e mois | 23,88 € |
| 24 mois, 1 boîte | 1,99 €/boîte/mois | 2,99 €/boîte/mois dès le 13e mois | 59,64 € |
| 36 mois, 1 boîte | 1,99 €/boîte/mois | 2,99 €/boîte/mois dès le 13e mois | 95,64 € |

Le comparatif sur trois ans, par boîte, relevé le 15/11/2026. Hostinger Email (Titan) : 23,88 € la première année puis 35,88 €/an, soit 95,64 € sur 36 mois. Zoho Mail Lite coûte 1,00 €/boîte/mois à tarif plat : 36,00 € sur la même période, sans piège de renouvellement puisque le prix ne bouge pas. Google Workspace Starter dépense 6,60 €/utilisateur/mois sans broncher : 237,60 € sur 3 ans. Sur 3 boîtes, l'écart enfle : 286,92 € chez Hostinger contre 712,80 € chez Google, soit 425,88 € de différence sur 36 mois. Voilà de quoi financer une petite campagne publicitaire. Le [Labo amens.store](/labo/) revérifie ces tarifs chaque mois et ping chaque hébergeur toutes les 60 s : 99,98 % de dispo sur 30 jours en Europe pour Hostinger, soit environ 9 min de coupure par mois. Mon avis : le Gmail gratuit pour ton business ne te coûte pas 0 €, il te coûte la confiance du premier contact.

## 6. Erreurs fréquentes et correctifs

- **Envoyer depuis un @gmail alors que ton domaine existe.** L'adresse coûte 2 €/mois ; le signal amateur se paie à chaque premier contact.
- **Oublier DMARC une fois SPF et DKIM réglés.** Sans DMARC, n'importe qui peut usurper ton domaine. Un mois en p=none pour lire les rapports, puis quarantine.
- **Pointer les MX vers l'ancien hébergeur après une migration.** Les emails arrivent deux semaines en retard, dans le vide. Vérifie les MX juste après le switch DNS.
- **Acheter Google Workspace « pour être tranquille ».** 237,60 € sur 3 ans pour 20 emails par semaine, c'est cher la tranquillité. Titan couvre cet usage pour 95,64 €.
- **Laisser le mot de passe de la boîte dans un Google Doc partagé.** Double authentification sur le compte propriétaire, coffre à mots de passe pour le reste.
- **Tester seulement en t'écrivant à toi-même.** Un auto-envoi passe toujours. Teste depuis et vers Gmail et Outlook, sur des domaines réels.

## 7. FAQ

### Comment créer une adresse email pro sur son nom de domaine sans finir en spam ?
Ouvre une boîte Hostinger Email (Titan) ou Zoho Mail sur ton domaine, ajoute les enregistrements MX, SPF et DKIM fournis dans ta zone DNS, puis publie une règle DMARC (`p=quarantine`) avant de connecter Gmail ou Outlook en IMAP. En 15 minutes, l'adresse `contact@tondomaine.fr` arrive en boîte principale.

### Hostinger Email fonctionne-t-il avec un domaine hébergé ailleurs ?
Oui. Pointe les enregistrements MX et SPF de ton registrar vers les valeurs Titan, la boîte fait le reste.

### Que font SPF, DKIM et DMARC, en clair ?
SPF liste les serveurs autorisés à envoyer en ton nom. DKIM signe chaque email. DMARC dit au destinataire quoi faire des imposteurs.

### Puis-je recevoir et envoyer mon email pro depuis Gmail ?
Oui, via IMAP ou une adresse d'envoi ajoutée aux réglages, avec les serveurs smtp.titan.email sur le port 465.

### Combien de boîtes ouvrir au démarrage ?
Une ou deux : contact@ et ton prénom@. La troisième arrive quand la compta devient pénible.

### Quelle est l'option la moins chère et fiable en 2026 ?
Zoho Mail Lite à 1,00 €/boîte/mois à tarif plat (relevé le 15/11/2026). Le forfait gratuit tient la boîte unique en webmail si le budget est nul.

### Peut-on changer de boîte sans perdre son historique ?
Oui : en IMAP, les dossiers vivent côté serveur. La migration recopie tout, la synchronisation fait le reste.

## 8. Verdict et liens affiliés

Pour un solo ou une petite équipe, Hostinger Email (Titan) est le rapport que je recommande sans hésiter : 1,99 €/boîte/mois la première année, antispam natif, enregistrements déployés en un clic. Ajoute DMARC toi-même et teste les en-têtes : 20 minutes de travail en plus pour des emails qui tombent dans la boîte principale.

Zoho convient aux démarrages à budget zéro, Google Workspace aux équipes déjà installées dans la suite Google. Dans les trois cas, la même règle s'applique : ton domaine, ton adresse, ton signal.

J'utilise une boîte Titan pour mes envois depuis 14 mois. Zéro message perdu en spam depuis le passage DMARC en quarantine.

<a rel="sponsored" href="https://www.hostinger.fr/email-professionnel?utm_source=amens&utm_medium=affiliate&utm_content=email-pro/creer">Consulter l'offre Hostinger Email (Titan) sur Hostinger.fr</a>

---

*Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.*
