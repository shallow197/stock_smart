import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { money, time, dateShort } from "../lib/format";
import { FullLoader, EmptyState, Segmented, Fab } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

const PERIODS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
];

export default function SalesPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const [state, setState] = useState({ loading: true, data: [], summary: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    api.get(`/sales?period=${period}`).then((r) => {
      if (active) setState({ loading: false, data: r.data, summary: r.summary });
    }).catch(() => active && setState({ loading: false, data: [], summary: null }));
    return () => { active = false; };
  }, [period]);

  const { loading, data, summary } = state;

  return (
    <div>
      <Header
        title="Ventes"
        subtitle={summary ? `Ce mois · ${money(summary.month_total)} FCFA` : "Historique des ventes"}
      />

      <div className="px-4 pt-4 space-y-4">
        <Segmented value={period} onChange={setPeriod} options={PERIODS} />

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-[12px] text-muted">Recettes</p>
            <p className="text-[21px] font-extrabold tnum text-ink leading-tight">{money(summary?.cash || 0)}</p>
            <p className="text-[12px] text-muted">{summary?.count || 0} vente{(summary?.count || 0) > 1 ? "s" : ""}</p>
          </div>
          <div className="card p-4" style={{ background: "var(--color-warn-soft)" }}>
            <p className="text-[12px] text-warn/80">À crédit</p>
            <p className="text-[21px] font-extrabold tnum text-warn leading-tight">{money(summary?.credit || 0)}</p>
            <p className="text-[12px] text-warn/70">sur la période</p>
          </div>
        </div>

        {loading ? (
          <FullLoader />
        ) : data.length === 0 ? (
          <EmptyState
            icon="cart"
            title="Aucune vente"
            hint="Enregistrez votre première vente de la période."
            action={<button onClick={() => navigate("/ventes/nouvelle")} className="btn-primary px-5"><Icon name="plus" size={18} /> Nouvelle vente</button>}
          />
        ) : (
          <ul className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 pb-4">
            {data.map((s) => {
              const cancelled = s.status === "cancelled";
              return (
                <li key={s.id}>
                  <button
                    onClick={() => navigate(`/ventes/${s.id}`)}
                    className="card w-full p-3 flex items-center gap-3 text-left active:scale-[0.99] transition"
                  >
                    <span className={`grid place-items-center w-11 h-11 rounded-full ${cancelled ? "bg-line text-muted" : "bg-brand-50 text-brand-600"}`}>
                      <Icon name={s.payment_method === "credit" ? "wallet" : "coins"} size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[14px] font-semibold truncate ${cancelled ? "text-muted line-through" : "text-ink"}`}>
                        {s.client_name || "Client comptant"} · {s.items_count} article{s.items_count > 1 ? "s" : ""}
                      </p>
                      <p className="text-[12px] text-muted">
                        {dateShort(s.sold_at)} · {time(s.sold_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[14px] font-bold tnum ${cancelled ? "text-muted line-through" : "text-ink"}`}>{money(s.total)}</span>
                      {cancelled ? (
                        <span className="chip bg-line text-muted">Annulée</span>
                      ) : s.payment_method === "credit" ? (
                        <span className="chip chip-warn">Crédit</span>
                      ) : (
                        <span className="chip chip-ok">Payé</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Fab onClick={() => navigate("/ventes/nouvelle")} label="Nouvelle vente" />
    </div>
  );
}
