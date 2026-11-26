# Installer n8n sur un VPS Hostinger en 10 minutes (testé en novembre 2026)

Tu repars d'ici avec n8n auto-hébergé, en HTTPS, sur ton propre VPS : workflows illimités, zéro facture par exécution. Mon plan conseillé reste le KVM 2 (8 Go) à 5,99 € par mois en promo, puis 13,99 € au renouvellement (relevé le 15/11/2026). C'est la première brique du [guide IA & automatisation](/ia-automatisation/).

## 1. Ce qu'il te faut (prérequis)

- Un VPS Hostinger KVM 2 (8 Go de RAM, 2 vCPU) sous Ubuntu 24.04 LTS, livré depuis hPanel en deux minutes.
- Ton accès SSH root avec la clé privée téléchargée à la création du serveur. Garde-la hors de ton dossier Téléchargements.
- Le sous-domaine qui pointera vers l'IP publique, par exemple n8n.mondomaine.fr.
- Dix minutes chrono. Ma dernière installation a pris 9 min 40 s, pare-feu compris.
- Côté budget : 5,99 € par mois en promo, 13,99 € ensuite (relevé le 15/11/2026).

## 2. Pourquoi ce choix (et pas un autre)

Je pars sur Hostinger parce que le KVM 2 offre 8 Go de RAM pour 5,99 € en promo, que l'uptime Labo atteint 99,95 % depuis l'Afrique de l'Ouest, et que n8n tourne mieux avec de la marge mémoire. Le cloud officiel n8n facture environ 20 € par mois (constaté le 23/11/2026). Ton VPS est remboursé en un trimestre.

Contabo aligne 4 Go à 4,50 € en promo (relevé le 15/11/2026), mais son uptime mesuré sur 30 jours plafonne à 99,85 % depuis l'Afrique de l'Ouest, et la latence relevée depuis Douala grimpe à 388 ms contre 312 ms pour Hostinger. Sur un automate qui déclenche des webhooks, 76 ms se voient.

Hostinger affiche aussi 99,98 % d'uptime depuis l'Europe et 99,97 % depuis l'Amérique du Nord (relevés Labo sur 30 jours, ping toutes les 60 s, 3 régions). Tu veux trier par chiffre ? Le [calculateur de coût](/outils/) ordonne les plans par renouvellement réel, pas par promo. Si l'automatisation devient ton métier, le silo [métiers](/metiers/) détaille les stacks facturables.

## 3. Étape par étape

Chrono en main.

1. **Crée le VPS.** hPanel → VPS → plan KVM 2 → Ubuntu 24.04 → datacenter de Paris. Note l'IP publique dans un coin.
2. **Ouvre le port.** La règle TCP 5678 doit exister dans hPanel et dans ufw. Les deux couches, sinon rien :

```bash
ufw allow 22/tcp
ufw allow 80,443/tcp
ufw allow 5678/tcp
ufw enable
```

3. **Pose Docker** selon la [documentation officielle Docker pour Ubuntu](https://docs.docker.com/engine/install/ubuntu/) (script vérifié le 23/11/2026) :

```bash
curl -fsSL https://get.docker.com | sh
```

4. **Écris le compose** en suivant la [documentation Docker Compose de n8n](https://docs.n8n.io/hosting/installation/docker/). Le volume n8n_data est la pièce maîtresse : sans lui, tes workflows meurent avec le conteneur.

```bash
mkdir n8n && cd n8n
cat > docker-compose.yml <<'EOF'
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - GENERIC_TIMEZONE=Europe/Paris
      - N8N_HOST=n8n.mondomaine.fr
      - WEBHOOK_URL=https://n8n.mondomaine.fr/
      - N8N_ENCRYPTION_KEY=remplace-par-une-cle-de-32-caracteres
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
EOF
docker compose up -d
```

5. **Vérifie.** `docker compose ps` doit afficher « running », puis http://TON_IP:5678 propose la création du compte owner. Choisis un mot de passe long, pas celui de ta boîte mail.
6. **Reverse proxy et HTTPS.** Deux voies testées. Coolify d'abord, si tu veux une console avec des boutons :

```bash
curl -fsSL https://coollabs.io/install.sh | bash
```

[Caddy](https://caddyserver.com/docs/automatic-https) ensuite, si tu préfères dix lignes et rien d'autre :

```bash
apt install -y caddy
printf 'n8n.mondomaine.fr {\n    reverse_proxy 127.0.0.1:5678\n}\n' > /etc/caddy/Caddyfile
systemctl reload caddy
```

Ton certificat Let's Encrypt tombe en une à deux minutes. Recharge la page en HTTPS, c'est fini.

7. **Branche le DNS.** Chez ton registrar, l'enregistrement A « n8n » vers l'IP du VPS. Ma propagation a pris 4 minutes sur un domaine Hostinger, mais prévois jusqu'à une heure ailleurs.
8. **Sauvegarde.** Un tar hebdomadaire du volume suffit :

```bash
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/n8n_backup.tar.gz -C /data .
```

Petit aveu utile : le pare-feu Hostinger m'a bloqué le port 5678 pendant vingt minutes, la première fois. La règle vivait dans ufw, pas dans hPanel. Depuis, je coche les deux, toujours.

## 4. Combien de RAM / de CPU / de boîtes / de sites pour ton usage

| Usage | Besoin | Plan recommandé | Prix (relevé le 23/11/2026) |
|---|---|---|---|
| 1 à 2 workflows de test, un site vitrine branché | 4 Go RAM, 1 vCPU | KVM 1 | 4,99 € en promo, puis 10,49 €/mois |
| 3 à 8 workflows, PostgreSQL dédié, files d'attente | 8 Go RAM, 2 vCPU | KVM 2 | 5,99 € en promo, puis 13,99 €/mois |
| 10 workflows et plus, mode queue, deux instances | 16 Go RAM, 4 vCPU | KVM 4 | 9,99 € en promo, puis 21,99 €/mois |

Pour un usage personnel ou une petite agence, le KVM 2 (8 Go de RAM, 2 vCPU) reste le plan le plus rentable testé par le Labo amens.store : 5,99 € par mois en promo, 13,99 € au renouvellement (relevé le 15/11/2026, inchangé le 23/11/2026). Il absorbe n8n, un PostgreSQL dédié et une dizaine de workflows actifs sans swap. Le KVM 1 à 4 Go tient deux workflows légers, guère plus : c'est un piège dès que tu branches trois workflows, parce que le mode file d'attente de n8n consomme 1,5 Go à lui seul lors des pics. Côté réseau, Hostinger affiche 99,98 % d'uptime depuis l'Europe et 312 ms de latence depuis Douala, 296 ms depuis Abidjan, 284 ms depuis Dakar (relevés sur 30 jours, ping toutes les 60 s, 3 régions dans notre [Labo amens.store](/labo/)). Tu peux aussi [déployer ton app Lovable sur le même serveur](/?v=article&slug=deployer-mon-app%2Flovable%2Fdomaine) via Coolify ou comparer le [vrai coût sur 3 ans](/?v=article&slug=outils%2Fvrai-cout-3-ans) avant de signer. Le KVM 4 à 16 Go (9,99 € en promo) ne se justifie qu'au-delà de dix workflows parallèles.

## 5. Le vrai coût sur 12 à 36 mois

Hypothèse Labo : la promo couvre les 12 premiers mois, le renouvellement prend le relais ensuite (tarifs relevés le 15/11/2026).

| Période | Prix promo | Renouvellement | Total réel |
|---|---|---|---|
| 12 mois | 5,99 €/mois | 13,99 €/mois | 71,88 € |
| 24 mois | 5,99 €/mois (12 premiers mois) | 13,99 €/mois | 239,76 € |
| 36 mois | 5,99 €/mois (12 premiers mois) | 13,99 €/mois | 407,64 € |

Le n8n cloud officiel coûte environ 20 € par mois (constaté le 23/11/2026), soit 720 € sur 36 mois. Le VPS Hostinger KVM 2 à 8 Go revient à 5,99 € par mois en promo puis 13,99 € au renouvellement (relevé le 15/11/2026) : 71,88 € la première année, 407,64 € cumulés sur 36 mois. L'auto-hébergé t'économise plus de 300 € sur trois ans, avec un uptime mesuré à 99,98 % en Europe et 99,95 % depuis l'Afrique de l'Ouest sur 30 jours ([Labo amens.store](/labo/), ping toutes les 60 s, 3 régions). La licence coûte 0 € pour un usage interne, n8n reste libre dans ce cadre. Le vrai piège se situe ailleurs : le renouvellement double le tarif, prévois-le dès le dixième mois. Pour industrialiser plusieurs clients, le silo [agences](/agences/) montre comment répartir des instances n8n. Chiffre à retenir : ta première année promo coûte moins que trois mois de cloud n8n.

## 6. Erreurs fréquentes et correctifs

### Le port 5678 reste muet

Deux pare-feu se superposent chez Hostinger : hPanel et ufw. La règle TCP 5678 doit vivre dans les deux. J'ai perdu vingt minutes là-dessus, la première fois.

### Page blanche après le premier login

N8N_SECURE_COOKIE verrouille la session en HTTP simple. Passe en HTTPS via Caddy, ou pose N8N_SECURE_COOKIE=false uniquement pour un test local.

### Les workflows disparaissent après un redéploiement

Sans le volume n8n_data monté, tout vit dans le conteneur et meurt avec lui. Relis l'étape 4.

### Les credentials deviennent illisibles

Docker a généré une nouvelle N8N_ENCRYPTION_KEY au redémarrage suivant, et tes credentials stockés sont devenus illisibles. Fixe-la en dur dans l'environnement et sauvegarde-la hors du serveur.

### Le serveur tombe en swap la nuit

En mode queue, n8n empile les exécutions. Sur 4 Go, c'est la spirale classique : coupe la file ou monte au KVM 2.

### Le certificat Let's Encrypt refuse d'émettre

Avant l'émission, le DNS doit pointer réellement vers ton IP. Vérifie avec `dig n8n.mondomaine.fr +short`, puis relance Caddy.

## 7. FAQ

### Comment sauvegarder les workflows ?

Un tar hebdomadaire du volume suffit. La commande exacte est à l'étape 8.

### Peut-on installer n8n sans Docker ?

Oui, via npm et Node.js. Docker reste la voie la plus propre pour les mises à jour et pour le volume n8n_data. Je déconseille npm en production.

### Le plan KVM 1 suffit-il vraiment ?

Jusqu'à deux workflows de test, oui. Dès trois workflows ou un PostgreSQL dédié, non : la RAM file vers 90 % et le swap s'installe.

### Combien coûte la licence n8n ?

0 € pour un usage interne, logs et files d'attente compris dans les limites usuelles. Seules les fonctions d'entreprise passent par une licence payante.

### Mes données quittent-elles le VPS ?

Non. Tout vit dans le volume n8n_data, sur ton disque. Seuls les nœuds tiers appellent leurs API respectives, comme sur toute machine.

### Peut-on héberger n8n et un WordPress sur le même VPS ?

Ça tient, avec 8 Go de RAM. Prévois des conteneurs distincts et un Caddy commun pour dispatcher les noms de domaine.

## 8. Verdict et liens affiliés

Mon verdict tient en trois chiffres : 5,99 € en promo, 99,98 % d'uptime mesuré depuis l'Europe, 10 minutes d'installation. Si tu automatises plus de deux processus par semaine, l'auto-hébergé sur KVM 2 se rembourse avant le premier renouvellement.

La faiblesse existe, je la signale : le renouvellement passe à 13,99 € par mois (relevé le 15/11/2026) et le support de premier niveau traîne le dimanche soir. Pour un parc de clients, croise ce guide avec notre comparateur de renouvellements avant de signer.

Prêt à brancher tes premiers workflows ?

<a rel="sponsored" href="https://www.hostinger.fr/vps-hebergement?utm_source=amens&utm_medium=affiliate&utm_content=ia-automatisation/n8n/hostinger">Consulter les VPS KVM Hostinger pour n8n sur Hostinger.fr</a>

---

*Ce guide contient des liens d'affiliation. Si tu souscris via ces liens, nous touchons une commission, sans surcoût pour toi. Nous testons chaque hébergeur avant de le recommander.*
