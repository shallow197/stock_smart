# EcoStock

PWA mobile-first de **gestion de stock, ventes et crédits clients** pour les commerçants et PME (Sénégal — FCFA, fuseau Africa/Dakar).

- **Backend** : Laravel (API REST) + MySQL + Laravel Sanctum (auth par token)
- **Frontend** : React + Vite + Tailwind CSS, installable en PWA

## Prérequis

- PHP 8.3+ avec les extensions `pdo_mysql`, `mbstring`, `gd`, `openssl`, `fileinfo`
- Composer
- MySQL 8+
- Node.js 20+

## Installation

### 1. Base de données

Créez une base `ecostock` (utf8mb4) :

```sql
CREATE DATABASE ecostock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend (dossier `api/`)

```bash
cd api
composer install
cp .env.example .env      # si .env absent
php artisan key:generate
# Ajustez DB_DATABASE / DB_USERNAME / DB_PASSWORD dans .env
php artisan migrate --seed
php artisan storage:link
```

Le seed crée un commerçant de démonstration :

- **Email** : `ousmane@boutique.sn`
- **Mot de passe** : `password`

### 3. Frontend (dossier `frontend/`)

```bash
cd frontend
npm install
```

## Lancer l'application

À la racine, en une commande (démarre l'API et le frontend) :

```bash
npm install
npm run dev
```

- **Frontend (PWA)** : http://localhost:5173
- **API (Laravel)** : http://127.0.0.1:8000

Le frontend proxy automatiquement `/api` et `/storage` vers l'API (voir `frontend/vite.config.js`).

## Périmètre (MVP)

Authentification · Tableau de bord · Produits & stock · Ventes (comptant/crédit) ·
Clients & crédits · Alertes · Journal d'activité quotidien · Paramètres.

Le stock, les crédits et le journal sont **dérivés des opérations réelles** (ventes,
mouvements de stock, paiements) — une seule source de vérité.
