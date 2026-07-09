# EcoStock — image unique : Laravel (API) sert aussi la PWA React compilée.
# À déployer sur Railway avec un plugin MySQL.

# ---- Étape 1 : build de la PWA React ----
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Étape 2 : Laravel + service du frontend ----
FROM php:8.4-cli-alpine AS app

# Extensions PHP requises (+ libs runtime).
RUN apk add --no-cache \
        libpng libjpeg-turbo freetype icu-libs oniguruma libzip \
        unzip git \
 && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
        libpng-dev libjpeg-turbo-dev freetype-dev icu-dev oniguruma-dev libzip-dev zlib-dev \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring gd bcmath intl zip \
 && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY api/ ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --no-scripts

# La PWA compilée est servie depuis public/ de Laravel.
COPY --from=frontend /app/frontend/dist/ ./public/

RUN chmod -R 775 storage bootstrap/cache

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

# Au démarrage : découverte des paquets, migrations, seed (idempotent), puis serveur.
CMD ["sh", "-c", "php artisan package:discover --ansi && php artisan migrate --force && php artisan db:seed --force && (php artisan storage:link || true) && php -S 0.0.0.0:${PORT:-8080} dev-server.php"]
