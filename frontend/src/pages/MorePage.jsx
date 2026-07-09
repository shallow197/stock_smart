import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/ui";
import { Icon } from "../lib/icons";

function Row({ icon, label, hint, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-canvas transition">
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${danger ? "bg-danger-soft text-danger" : "bg-brand-50 text-brand-600"}`}>
        <Icon name={icon} size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold ${danger ? "text-danger" : "text-ink"}`}>{label}</p>
        {hint && <p className="text-[12px] text-muted truncate">{hint}</p>}
      </div>
      {!danger && <Icon name="chevronR" size={18} className="text-muted" />}
    </button>
  );
}

export default function MorePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="text-white rounded-b-3xl pt-safe pb-8" style={{ background: "linear-gradient(150deg,#2e8b57,#1e5f4f 60%,#184c40)" }}>
        <div className="flex items-center gap-4 px-5 pt-5">
          <div className="ring-4 ring-white/20 rounded-2xl">
            <Avatar label={user?.shop_name || user?.name} size={60} tone="bg-white text-brand-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[19px] font-extrabold leading-tight truncate">{user?.shop_name}</h1>
            <p className="text-[13px] text-white/75 truncate">{user?.name}</p>
            <p className="text-[12px] text-white/60 truncate">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-5 space-y-4">
        <div className="card overflow-hidden divide-y divide-line">
          <Row icon="calendar" label="Journal d'activité" hint="Opérations & rapport quotidien" onClick={() => navigate("/journal")} />
          <Row icon="alertTri" label="Centre d'alertes" hint="Ruptures, stocks bas, crédits" onClick={() => navigate("/alertes")} />
        </div>

        <p className="px-2 text-[12px] font-semibold text-muted uppercase tracking-wide">Paramètres</p>
        <div className="card overflow-hidden divide-y divide-line">
          <Row icon="user" label="Profil & boutique" hint="Nom, téléphone, adresse" onClick={() => navigate("/parametres/profil")} />
          <Row icon="settings" label="Préférences" hint="Devise, format de date, fuseau" onClick={() => navigate("/parametres/preferences")} />
          <Row icon="eye" label="Sécurité" hint="Changer le mot de passe" onClick={() => navigate("/parametres/securite")} />
        </div>

        <div className="card overflow-hidden">
          <Row icon="logout" label="Se déconnecter" danger onClick={logout} />
        </div>

        <p className="text-center text-[12px] text-muted/70 pt-2">EcoStock · v1.0 — Dakar, FCFA</p>
      </div>
    </div>
  );
}
