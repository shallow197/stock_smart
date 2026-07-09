import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { money, qty, time, dateLong, todayKey } from "../lib/format";
import { FullLoader, EmptyState } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

const KIND = {
  sale: { icon: "coins", tone: "bg-brand-50 text-brand-600" },
  credit: { icon: "wallet", tone: "bg-warn-soft text-warn" },
  cancellation: { icon: "refresh", tone: "bg-line text-muted" },
  entry: { icon: "in", tone: "bg-brand-50 text-brand-600" },
  adjustment: { icon: "adjust", tone: "bg-warn-soft text-warn" },
  payment: { icon: "arrowDown", tone: "bg-credit-soft text-credit" },
};

function addDays(key, n) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function JournalPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayKey());
  const [state, setState] = useState({ loading: true, activities: [], report: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    api.get(`/journal?date=${date}`).then((r) => {
      if (active) setState({ loading: false, activities: r.activities, report: r.report });
    }).catch(() => active && setState({ loading: false, activities: [], report: null }));
    return () => { active = false; };
  }, [date]);

  const { loading, activities, report } = state;
  const isToday = date === todayKey();

  return (
    <div className="app-frame lg:max-w-3xl min-h-full pb-8">
      <Header title="Journal d'activité" subtitle={dateLong(date + "T12:00:00")} back />

      <div className="px-4 pt-4 space-y-4">
        {/* Navigation par jour */}
        <div className="flex items-center justify-between card px-2 py-2">
          <button onClick={() => setDate(addDays(date, -1))} className="grid place-items-center w-10 h-10 rounded-xl active:bg-line">
            <Icon name="back" size={20} />
          </button>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <Icon name="calendar" size={17} className="text-brand-500" />
            {isToday ? "Aujourd'hui" : dateLong(date + "T12:00:00")}
          </div>
          <button
            onClick={() => !isToday && setDate(addDays(date, 1))}
            disabled={isToday}
            className="grid place-items-center w-10 h-10 rounded-xl active:bg-line disabled:opacity-30"
          >
            <Icon name="chevronR" size={20} />
          </button>
        </div>

        {/* Rapport de synthèse */}
        {report && (
          <div className="card p-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Ventes" value={report.sales_count} />
              <Stat label="Recettes" value={`${money(report.cash_received)} F`} />
              <Stat label="Articles vendus" value={qty(report.items_sold)} />
              <Stat label="Crédit accordé" value={`${money(report.credit_given)} F`} tone={report.credit_given > 0 ? "warn" : undefined} />
            </div>
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <FullLoader />
        ) : activities.length === 0 ? (
          <EmptyState icon="clock" title="Aucune activité" hint={isToday ? "Les opérations du jour s'afficheront ici." : "Aucune opération ce jour-là."} />
        ) : (
          <div className="card p-4">
            <h2 className="text-[15px] font-bold text-ink mb-2">{activities.length} opération{activities.length > 1 ? "s" : ""}</h2>
            <ul className="divide-y divide-line">
              {activities.map((a, i) => {
                const meta = KIND[a.kind] || KIND.sale;
                return (
                  <li key={i}>
                    <button
                      onClick={() => a.link && navigate(a.link.type === "sale" ? `/ventes/${a.link.id}` : a.link.type === "client" ? `/clients/${a.link.id}` : `/stock/${a.link.id}`)}
                      className="w-full flex items-center gap-3 py-2.5 text-left"
                    >
                      <span className={`grid place-items-center w-9 h-9 rounded-full ${meta.tone}`}>
                        <Icon name={meta.icon} size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13.5px] font-semibold ${a.muted ? "text-muted line-through" : "text-ink"}`}>{a.title}</p>
                        <p className="text-[12px] text-muted truncate">{a.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {a.amount != null && (
                          <p className={`text-[14px] font-bold tnum ${a.muted ? "text-muted" : a.sign > 0 ? "text-brand-600" : "text-ink"}`}>
                            {a.sign > 0 ? "+" : ""}{money(a.amount)}
                          </p>
                        )}
                        <p className="text-[11px] text-muted tnum">{time(a.at)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`text-[17px] font-extrabold tnum ${tone === "warn" ? "text-warn" : "text-ink"}`}>{value}</p>
    </div>
  );
}
