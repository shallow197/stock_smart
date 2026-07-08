import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { BottomNav } from "./BottomNav";

export function RequireAuth() {
  const auth = useAuth();
  const loc = useLocation();

  if (auth.loading) {
    return (
      <div className="min-h-dvh bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
            Chargement…
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

