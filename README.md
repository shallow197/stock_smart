# Gestion de stock (vendeur)

## Lancer l’application (1 commande)

À la racine du projet :

```bash
npm install
npm run dev
```

- **Frontend (UI)** : `http://localhost:5173`
- **Backend (API)** : `http://localhost:4000`

Le frontend proxy automatiquement `/api` et `/uploads` vers le backend (voir `frontend/vite.config.js`).

## Prérequis backend

Dans `backend/.env` :

- `DATABASE_URL`
- `JWT_SECRET`

Puis (une fois) :

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
```
