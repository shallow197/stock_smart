import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { relative } from "../lib/format";
import { FullLoader, EmptyState, Segmented } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

const STYLE = {
  out: { border: "#dc2626", bg: "#fef4f4", icon: "alertCirc", iconCls: "bg-danger-soft text-danger" },
  low: { border: "#d97706", bg: "#fdf7ec", icon: "alertTri", iconCls: "bg-warn-soft text-warn" },
  credit: { border: "#2563eb", bg: "#f1f5fe", icon: "wallet", iconCls: "bg-credit-soft text-credit" },
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const { data, loading, reload } = useApi("/alerts");
  const [tab, setTab] = useState("all");

  const alerts = data?.data || [];
  const counts = data?.counts || { all: 0, stock: 0, credit: 0 };

  const filtered = alerts.filter((a) => tab === "all" || a.category === tab);

  async function markSeen() {
    try { await api.post("/alerts/seen"); reload(); } catch { /* ignore */ }
  }

  function open(a) {
    if (a.product_id) navigate(`/stock/${a.product_id}`);
    else if (a.client_id) navigate(`/clients/${a.client_id}`);
  }

  return (
    <div className="app-frame min-h-full pb-8">
      <Header
        title="Alertes"
        subtitle={`${counts.all} alerte${counts.all > 1 ? "s" : ""} active${counts.all > 1 ? "s" : ""}`}
        back
        right={counts.all > 0 ? (
          <button onClick={markSeen} className="text-[13px] font-semibold text-white/90 px-2">Tout marquer lu</button>
        ) : null}
      />

      <div className="px-4 pt-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "Toutes", count: counts.all },
            { value: "stock", label: "Stock", count: counts.stock },
            { value: "credit", label: "Crédits", count: counts.credit },
          ]}
        />
      </div>

      {loading ? (
        <FullLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon="bell" title="Aucune alerte" hint="Tout est sous contrôle. Les ruptures, stocks bas et crédits en retard apparaîtront ici." />
      ) : (
        <ul className="px-4 lg:px-6 mt-4 space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
          {filtered.map((a) => {
            const st = STYLE[a.type] || STYLE.low;
            return (
              <li key={a.id}>
                <button
                  onClick={() => open(a)}
                  className="w-full text-left rounded-2xl border border-line pl-3.5 pr-3 py-3 flex items-start gap-3 active:scale-[0.99] transition"
                  style={{ background: st.bg, borderLeft: `4px solid ${st.border}` }}
                >
                  <span className={`grid place-items-center w-9 h-9 rounded-full shrink-0 ${st.iconCls}`}>
                    <Icon name={st.icon} size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-ink">{a.title}</p>
                    <p className="text-[13px] text-ink/75 leading-snug">{a.message}</p>
                    <p className="text-[11px] text-muted mt-0.5">{relative(a.since)}</p>
                  </div>
                  <Icon name="chevronR" size={18} className="text-muted mt-1 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
