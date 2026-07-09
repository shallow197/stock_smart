import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ToastProvider } from "./components/Toast";
import { FullLoader } from "./components/ui";
import AppShell from "./components/AppShell";
import Sidebar from "./components/Sidebar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SalesPage from "./pages/SalesPage";
import NewSalePage from "./pages/NewSalePage";
import SaleDetailPage from "./pages/SaleDetailPage";
import ClientsPage from "./pages/ClientsPage";
import ClientFormPage from "./pages/ClientFormPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import AlertsPage from "./pages/AlertsPage";
import JournalPage from "./pages/JournalPage";
import MorePage from "./pages/MorePage";
import ProfilePage from "./pages/ProfilePage";
import PreferencesPage from "./pages/PreferencesPage";
import SecurityPage from "./pages/SecurityPage";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-frame"><FullLoader label="Ouverture d'EcoStock…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="lg:pl-60">
      <Sidebar />
      {children}
    </div>
  );
}

function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-frame"><FullLoader /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />

      {/* Écrans principaux avec navigation basse */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/stock" element={<ProductsPage />} />
        <Route path="/ventes" element={<SalesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/plus" element={<MorePage />} />
      </Route>

      {/* Écrans plein écran (avec retour) */}
      <Route path="/stock/nouveau" element={<RequireAuth><ProductFormPage /></RequireAuth>} />
      <Route path="/stock/:id" element={<RequireAuth><ProductDetailPage /></RequireAuth>} />
      <Route path="/stock/:id/modifier" element={<RequireAuth><ProductFormPage /></RequireAuth>} />
      <Route path="/ventes/nouvelle" element={<RequireAuth><NewSalePage /></RequireAuth>} />
      <Route path="/ventes/:id" element={<RequireAuth><SaleDetailPage /></RequireAuth>} />
      <Route path="/clients/nouveau" element={<RequireAuth><ClientFormPage /></RequireAuth>} />
      <Route path="/clients/:id" element={<RequireAuth><ClientDetailPage /></RequireAuth>} />
      <Route path="/clients/:id/modifier" element={<RequireAuth><ClientFormPage /></RequireAuth>} />
      <Route path="/alertes" element={<RequireAuth><AlertsPage /></RequireAuth>} />
      <Route path="/journal" element={<RequireAuth><JournalPage /></RequireAuth>} />
      <Route path="/parametres/profil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/parametres/preferences" element={<RequireAuth><PreferencesPage /></RequireAuth>} />
      <Route path="/parametres/securite" element={<RequireAuth><SecurityPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// Enregistrement du service worker (PWA installable, cache hors-ligne).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
