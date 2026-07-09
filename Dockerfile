# EcoStock — image unique : Laravel (API) sert aussi la PWA React compilée,
# via FrankenPHP (serveur de production : fichiers statiques concurrents + PHP).
# À déployer sur Railway avec un plugin MySQL.

# ---- Étape 1 : build de la PWA React ----
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Étape 2 : FrankenPHP + Laravel ----
FROM dunglas/frankenphp:1-php8.4 AS app

# Extensions PHP requises par Laravel.
RUN install-php-extensions pdo_mysql mbstring gd intl bcmath zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY api/ ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --no-scripts

# La PWA compilée est servie depuis public/ (Caddy sert les statiques ;
# les routes non-fichier passent par Laravel, qui renvoie l'index de la SPA).
COPY --from=frontend /app/frontend/dist/ ./public/

RUN chmod -R 777 storage bootstrap/cache

# Réglages de production (les secrets DB + APP_KEY se définissent dans Railway).
ENV APP_ENV=production \
    APP_DEBUG=false \
    APP_TIMEZONE=Africa/Dakar \
    APP_LOCALE=fr \
    APP_FALLBACK_LOCALE=fr \
    LOG_CHANNEL=stderr \
    SESSION_DRIVER=array \
    CACHE_STORE=file \
    QUEUE_CONNECTION=sync \
    DB_CONNECTION=mysql

EXPOSE 8080

# Au démarrage : découverte des paquets, migrations, seed (idempotent), puis
# FrankenPHP en écoute sur le port fourni par Railway ($PORT).
CMD ["sh", "-c", "php artisan package:discover --ansi && php artisan migrate --force && php artisan db:seed --force && (php artisan storage:link || true) && SERVER_NAME=\":${PORT:-8080}\" frankenphp run --config /etc/frankenphp/Caddyfile"]
