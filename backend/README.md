# API Gestion Stock (Backend)

## Prérequis
- Node.js 18+
- MySQL 8+

## Configuration
1. Copier `.env.example` vers `.env` et remplir `DATABASE_URL` + `JWT_SECRET`.
2. Installer les dépendances :

```bash
npm install
```

## Base de données (Prisma)

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Lancer l’API

```bash
npm run dev
```

Healthcheck : `GET /api/health`

## Pagination / recherche (API)
- `GET /api/products?page=1&pageSize=20&q=...&category=...&available=true|false&lowStockOnly=true`
- `GET /api/clients?page=1&pageSize=20&q=...`
- `GET /api/clients/:id?page=1&pageSize=20&type=VENTE` (historique)

## Calendrier (journaux)
- `GET /api/logs/dates?month=YYYY-MM` → jours disponibles du mois
- `GET /api/logs/range?from=YYYY-MM-DD&to=YYYY-MM-DD` → liste des journaux sur une période

