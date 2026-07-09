import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";

// En-tête vert réutilisable (dégradé, texte blanc, coins bas arrondis).
export default function Header({ title, subtitle, onBack, back, right, flat = false }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <header
      className={`sticky top-0 z-30 text-white ${flat ? "" : "rounded-b-3xl"} pt-safe`}
      style={{ background: "linear-gradient(150deg, #2e8b57 0%, #1e5f4f 60%, #184c40 100%)" }}
    >
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-4">
        {back && (
          <button
            onClick={handleBack}
            aria-label="Retour"
            className="grid place-items-center w-9 h-9 -ml-1.5 rounded-full active:bg-white/15 transition"
          >
            <Icon name="back" size={22} strokeWidth={2.2} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[13px] text-white/70 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

// Cloche avec pastille de non-lues, pour les en-têtes.
export function BellButton({ count = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Alertes"
      className="relative grid place-items-center w-10 h-10 rounded-full bg-white/15 active:scale-95 transition"
    >
      <Icon name="bell" size={21} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-brand-600">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
