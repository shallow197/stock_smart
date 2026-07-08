import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./ui/AppShell";
import { AuthLayout } from "./ui/AuthLayout";
import { RequireAuth } from "./ui/RequireAuth";

import { LoginPage } from "./views/LoginPage";
import { RegisterPage } from "./views/RegisterPage";
import { DashboardPage } from "./views/DashboardPage";
import { ProductsPage } from "./views/ProductsPage";
import { ClientsPage } from "./views/ClientsPage";
import { ClientProfilePage } from "./views/ClientProfilePage";
import { LogTodayPage } from "./views/LogTodayPage";
import { LogByDatePage } from "./views/LogByDatePage";
import { SettingsPage } from "./views/SettingsPage";

import { AuthProvider } from "./auth/AuthProvider";

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    ),
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/products", element: <ProductsPage /> },
          { path: "/clients", element: <ClientsPage /> },
          { path: "/clients/:id", element: <ClientProfilePage /> },
          { path: "/log", element: <LogTodayPage /> },
          { path: "/log/:dateKey", element: <LogByDatePage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
      { path: "*", element: <div className="p-6">Page introuvable.</div> },
    ],
  },
]);

