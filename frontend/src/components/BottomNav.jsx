import { NavLink } from "react-router-dom";
import { Icon } from "../lib/icons";

const TABS = [
  { to: "/", icon: "home", label: "Accueil", end: true },
  { to: "/stock", icon: "box", label: "Stock" },
  { to: "/ventes", icon: "cart", label: "Ventes" },
  { to: "/clients", icon: "users", label: "Clients" },
  { to: "/plus", icon: "grid", label: "Plus" },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line pb-safe">
      <div className="grid grid-cols-5">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className="group flex flex-col items-center gap-0.5 py-2.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid place-items-center transition ${
                    isActive ? "text-brand-600" : "text-muted"
                  }`}
                >
                  <Icon name={t.icon} size={23} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isActive ? "text-brand-700" : "text-muted"
                  }`}
                >
                  {t.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
