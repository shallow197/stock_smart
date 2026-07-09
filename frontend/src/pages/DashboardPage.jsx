import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useApi } from "../lib/useApi";
import { money, moneyCompact, initials, avatarTone } from "../lib/format";
import { FullLoader, Avatar } from "../components/ui";
import { BellButton } from "../components/Header";
import { Icon } from "../lib/icons";

function StatCard({ label, value, sub, tone = "default", icon, onClick }) {
  const tones = {
    default: "bg-surface border-line",
    danger: "border-transparent text-white",
  };
  const style =
    tone === "danger"
      ? { background: "linear-gradient(160deg,#ef4444,#dc2626)", boxShadow: "0 10px 24px -12px rgba(220,38,38,.6)" }
      : {};
  return (
    <button
      onClick={onClick}
      className={`card p-4 text-left flex flex-col gap-1 active:scale-[0.98] transition ${tones[tone]}`}
      style={style}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-medium ${tone === "danger" ? "text-white/80" : "text-muted"}`}>{label}</span>
        <span className={tone === "danger" ? "text-white/90" : "text-brand-400"}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <span className={`text-[22px] font-extrabold tnum leading-tight ${tone === "danger" ? "text-white" : "text-ink"}`}>
        {value}
      </span>
      {sub && <span className={`text-[12px] ${tone === "danger" ? "text-white/80" : "text-muted"}`}>{sub}</span>}
    </button>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useApi("/dashboard");

  if (loading || !data) {
    return (
      <>
        <DashHeader user={user} alerts={0} navigate={navigate} />
        <FullLoader />
      </>
    );
  }

  const maxBar = Math.max(...data.sales_7days.map((d) => d.total), 1);
  const change = data.today_change_pct;

  return (
    <div className="animate-rise">
      <DashHeader user={user} alerts={data.alerts_count} navigate={navigate} />

      <div className="px-4 -mt-6 space-y-4 lg:px-6">
        {/* Indicateurs clés */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Ventes aujourd'hui"
            value={money(data.today_sales)}
            sub={
              change == null
                ? `${data.today_sales_count} vente${data.today_sales_count > 1 ? "s" : ""}`
                : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% vs hier`
            }
            icon="cart"
            onClick={() => navigate("/ventes")}
          />
          <StatCard
            label="Valeur du stock"
            value={moneyCompact(data.stock_value)}
            sub={`${data.products_count} produits`}
            icon="box"
            onClick={() => navigate("/stock")}
          />
          <StatCard
            label="Crédits clients"
            value={money(data.credit_outstanding)}
            sub={`${data.credit_clients_count} client${data.credit_clients_count > 1 ? "s" : ""}`}
            icon="wallet"
            onClick={() => navigate("/clients?filter=credit")}
          />
          <StatCard
            label="Alertes stock"
            value={data.alerts_count}
            sub={data.alerts_count > 0 ? "À traiter" : "Tout va bien"}
            tone={data.alerts_count > 0 ? "danger" : "default"}
            icon="alertTri"
            onClick={() => navigate("/alertes")}
          />
        </div>

        {/* Graphique + Top produits : côte à côte sur desktop */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* Graphique 7 jours */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-ink">Ventes des 7 derniers jours</h2>
            <span className="text-[11px] font-semibold text-muted">FCFA</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {data.sales_7days.map((d, i) => {
              const h = Math.max((d.total / maxBar) * 100, 4);
              const isToday = i === data.sales_7days.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className="w-full max-w-[26px] rounded-t-md origin-bottom"
                      style={{
                        height: `${h}%`,
                        background: isToday
                          ? "linear-gradient(180deg,#2e8b57,#1e5f4f)"
                          : "linear-gradient(180deg,#a7d3c2,#6fb89e)",
                        animation: "ecos-bar .5s ease both",
                        animationDelay: `${i * 50}ms`,
                      }}
                      title={money(d.total, true)}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${isToday ? "text-brand-700" : "text-muted"}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top produits */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-bold text-ink">Top produits</h2>
            <button onClick={() => navigate("/stock")} className="text-[13px] font-semibold text-brand-600 flex items-center gap-0.5">
              Voir tout <Icon name="chevronR" size={15} />
            </button>
          </div>
          {data.top_products.length === 0 ? (
            <p className="text-[13px] text-muted py-6 text-center">Aucune vente sur les 30 derniers jours.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.top_products.map((p) => (
                <li key={p.product_id}>
                  <button
                    onClick={() => navigate(`/stock/${p.product_id}`)}
                    className="w-full flex items-center gap-3 py-2.5 text-left active:opacity-70"
                  >
                    <Avatar label={p.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink truncate">{p.name}</p>
                      <p className="text-[12px] text-muted">{p.qty_sold} vendus ce mois</p>
                    </div>
                    <span className="text-[14px] font-bold tnum text-brand-700">{money(p.revenue)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function DashHeader({ user, alerts, navigate }) {
  return (
    <header
      className="text-white rounded-b-3xl pt-safe pb-10"
      style={{ background: "linear-gradient(150deg,#2e8b57 0%,#1e5f4f 55%,#184c40 100%)" }}
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="min-w-0">
          <p className="text-[13px] text-white/75">Bonjour</p>
          <h1 className="text-[22px] font-extrabold leading-tight truncate">{user?.name?.split(" ")[0] || "Commerçant"}</h1>
          <p className="text-[13px] text-white/70 truncate">{user?.shop_name}</p>
        </div>
        <BellButton count={alerts} onClick={() => navigate("/alertes")} />
      </div>
    </header>
  );
}
