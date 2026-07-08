import React from "react";
import { Outlet, Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
        <header className="mb-6">
          <div className="text-sm font-semibold tracking-wide text-zinc-500">Gestion de stock</div>
          <div className="text-2xl font-bold">Connexion vendeur</div>
          <p className="mt-1 text-sm text-zinc-600">Interface en français, optimisée mobile.</p>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="mt-6 text-center text-xs text-zinc-500">
          <span>Besoin d’aide ? </span>
          <Link className="underline" to="/register">
            Créer un compte
          </Link>
        </footer>
      </div>
    </div>
  );
}

