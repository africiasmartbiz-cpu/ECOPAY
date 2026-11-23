# SCHOOLPAY — Guide de Déploiement en Production

Ce guide détaille les étapes de déploiement de la plateforme **SCHOOLPAY** pour un environnement de production sécurisé et résilient.

---

## 1. Prérequis Serveur

- **Système d'exploitation :** Ubuntu 22.04 LTS ou Debian 12
- **Ressources recommandées :** 2 vCPU, 4 Go RAM, 40 Go SSD
- **Services requis :** Node.js 20 LTS, PostgreSQL 15+, Nginx, Certbot (SSL Let's Encrypt)

---

## 2. Configuration de la Base de Données PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur dédié
CREATE DATABASE schoolpay_prod;
CREATE USER schoolpay_user WITH ENCRYPTED PASSWORD 'mot_de_passe_ultra_securise_2025';
GRANT ALL PRIVILEGES ON DATABASE schoolpay_prod TO schoolpay_user;
\q
```

Mettre à jour le fichier `.env` sur le serveur :
```env
DATABASE_URL="postgresql://schoolpay_user:mot_de_passe_ultra_securise_2025@localhost:5432/schoolpay_prod?schema=public"
JWT_SECRET="cle_secrete_aleatoire_32_caracteres_min"
DEFAULT_CURRENCY="XOF"
DEFAULT_TIMEZONE="Africa/Lome"
NEXT_PUBLIC_APP_URL="https://app.schoolpay.tg"
```

---

## 3. Installation et Build de l'Application

```bash
# Cloner le dépôt dans /var/www/schoolpay
git clone <url_du_repo> /var/www/schoolpay
cd /var/www/schoolpay

# Installer les dépendances
npm ci --production=false

# Générer le client Prisma et exécuter les migrations
npx prisma generate
npx prisma migrate deploy

# Compiler le projet Next.js pour la production
npm run build
```

---

## 4. Gestionnaire de Processus (PM2)

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer SCHOOLPAY avec PM2
pm2 start npm --name "schoolpay" -- start

# Configurer le démarrage automatique au boot
pm2 startup
pm2 save
```

---

## 5. Reverse Proxy Nginx & Certificat SSL HTTPS

Créer `/etc/nginx/sites-available/schoolpay` :

```nginx
server {
    listen 80;
    server_name app.schoolpay.tg;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer et sécuriser avec HTTPS :
```bash
sudo ln -s /etc/nginx/sites-available/schoolpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtenir le certificat SSL Let's Encrypt
sudo certbot --nginx -d app.schoolpay.tg
```

---

## 6. Stratégie de Sauvegardes Quotidiennes (Afrique / Togo)

Créer une tâche cron pour sauvegarder la base chaque nuit à 02h00 GMT :
```bash
crontab -e
# Ajouter :
0 2 * * * pg_dump -U schoolpay_user schoolpay_prod | gzip > /var/backups/schoolpay/db_$(date +\%Y\%m\%d).sql.gz
```
