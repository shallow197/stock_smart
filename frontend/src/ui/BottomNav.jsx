import { NavLink } from "react-router-dom";

function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
          isActive ? "text-violet-600" : "text-zinc-600"
        }`
      }
    >
      <div className={`h-2 w-10 rounded-full ${to && ""} ${""}`}></div>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2">
        <Item to="/dashboard" label="Accueil" />
        <Item to="/products" label="Produits" />
        <Item to="/log" label="Journal" />
        <Item to="/clients" label="Clients" />
        <Item to="/settings" label="Réglages" />
      </div>
    </nav>
  );
}

