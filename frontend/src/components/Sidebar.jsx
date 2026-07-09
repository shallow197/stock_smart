import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../lib/icons";
import { Avatar } from "./ui";
import Logo from "./Logo";

const NAV = [
  { to: "/", icon: "home", label: "Accueil", end: true },
  { to: "/stock", icon: "box", label: "Stock" },
  { to: "/ventes", icon: "cart", label: "Ventes" },
  { to: "/clients", icon: "users", label: "Clients" },
  { to: "/alertes", icon: "bell", label: "Alertes" },
  { to: "/journal", icon: "calendar", label: "Journal" },
  { to: "/plus", icon: "grid", label: "Plus" },
];

// Barre latérale de navigation — visible uniquement sur desktop (≥ lg).
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-surface border-r border-line z-40">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-line">
        <Logo size={36} />
        <div className="leading-tight">
          <p className="text-[16px] font-extrabold text-brand-700">EcoStock</p>
          <p className="text-[11px] text-muted -mt-0.5">Gestion de stock</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-11 rounded-xl text-[14.5px] font-semibold transition ${
                isActive ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-canvas hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={n.icon} size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={() => navigate("/parametres/profil")}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-canvas transition text-left"
        >
          <Avatar label={user?.shop_name || user?.name} size={38} tone="bg-brand-100 text-brand-700" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-ink truncate">{user?.shop_name}</p>
            <p className="text-[12px] text-muted truncate">{user?.name}</p>
          </div>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 h-10 mt-1 rounded-xl text-[13.5px] font-semibold text-danger hover:bg-danger-soft/60 transition"
        >
          <Icon name="logout" size={18} /> Se déconnecter
        </button>
      </div>
    </aside>
  );
}
