import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { money, dateShort, time } from "../lib/format";
import { FullLoader, Avatar, ClientStatusChip, Sheet, Field, Spinner, IconButton } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";
import { useToast } from "../components/Toast";

const HIST_ICON = {
  credit_sale: { icon: "arrowUp", tone: "bg-warn-soft text-warn" },
  cash_sale: { icon: "coins", tone: "bg-brand-50 text-brand-600" },
  payment: { icon: "arrowDown", tone: "bg-brand-50 text-brand-600" },
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, reload } = useApi(`/clients/${id}`, [id]);
  const [sheet, setSheet] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || !data) {
    return (<div className="app-frame"><Header title="Client" back /><FullLoader /></div>);
  }
  const c = data.data;
  const history = data.history || [];

  async function pay() {
    setBusy(true);
    try {
      await api.post(`/clients/${id}/payments`, { amount: Number(amount) });
      toast.success("Paiement enregistré.");
      setSheet(false); setAmount("");
      reload();
    } catch (e) {
      toast.error(e.errors?.amount?.[0] || e.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="app-frame lg:max-w-5xl min-h-full pb-8">
      <Header
        title={c.name}
        subtitle={c.created_at ? `Client depuis ${dateShort(c.created_at)}` : "Fiche client"}
        back
        right={<IconButton icon="edit" onClick={() => navigate(`/clients/${id}/modifier`)} className="bg-white/15 text-white" size={20} label="Modifier" />}
      />

      <div className="px-4 -mt-6 space-y-4">
        {/* Carte d'identité */}
        <div className="card p-4 flex flex-col items-center text-center">
          <Avatar label={c.name} size={72} />
          <h2 className="mt-2 text-[18px] font-bold text-ink">{c.name}</h2>
          <div className="mt-1 space-y-0.5 text-[13px] text-muted">
            {c.phone && <p className="flex items-center justify-center gap-1.5"><Icon name="phone" size={14} /> {c.phone}</p>}
            {c.address && <p className="flex items-center justify-center gap-1.5"><Icon name="pin" size={14} /> {c.address}</p>}
          </div>
          <div className="mt-2"><ClientStatusChip status={c.status} /></div>
        </div>

        {/* Indicateurs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4" style={{ background: c.credit_balance > 0 ? "var(--color-warn-soft)" : undefined }}>
            <p className={`text-[12px] ${c.credit_balance > 0 ? "text-warn/80" : "text-muted"}`}>Crédit en cours</p>
            <p className={`text-[20px] font-extrabold tnum ${c.credit_balance > 0 ? "text-warn" : "text-ink"}`}>{money(c.credit_balance)}</p>
            <p className={`text-[11px] ${c.credit_balance > 0 ? "text-warn/70" : "text-muted"}`}>FCFA</p>
          </div>
          <div className="card p-4">
            <p className="text-[12px] text-muted">Total dépensé</p>
            <p className="text-[20px] font-extrabold tnum text-ink">{money(c.total_spent)}</p>
            <p className="text-[11px] text-muted">{c.purchases_count} achat{c.purchases_count > 1 ? "s" : ""}</p>
          </div>
        </div>

        {c.credit_balance > 0 && (
          <button onClick={() => setSheet(true)} className="btn-primary w-full">
            <Icon name="plus" size={18} /> Encaisser un paiement
          </button>
        )}

        {/* Historique */}
        <div className="card p-4">
          <h2 className="text-[15px] font-bold text-ink mb-1">Historique</h2>
          {history.length === 0 ? (
            <p className="text-[13px] text-muted py-6 text-center">Aucune opération.</p>
          ) : (
            <ul className="divide-y divide-line">
              {history.map((h, i) => {
                const meta = HIST_ICON[h.kind] || HIST_ICON.cash_sale;
                return (
                  <li key={i}>
                    <button
                      onClick={() => h.sale_id && navigate(`/ventes/${h.sale_id}`)}
                      className="w-full flex items-center gap-3 py-2.5 text-left"
                    >
                      <span className={`grid place-items-center w-9 h-9 rounded-full ${meta.tone}`}>
                        <Icon name={meta.icon} size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-ink">{h.title}</p>
                        <p className="text-[12px] text-muted">{dateShort(h.at)} · {time(h.at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[14px] font-bold tnum ${h.sign > 0 ? "text-warn" : h.sign < 0 ? "text-brand-600" : "text-ink"}`}>
                          {h.sign > 0 ? "+" : h.sign < 0 ? "−" : ""}{money(h.amount)}
                        </p>
                        <span className={`chip ${h.badge === "Crédit" ? "chip-warn" : h.badge === "Payé" ? "chip-ok" : h.badge === "Annulée" ? "bg-line text-muted" : "chip-ok"}`}>{h.badge}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Encaisser un paiement">
        <div className="space-y-4">
          <p className="text-[13px] text-muted">
            Crédit en cours : <span className="font-bold text-warn">{money(c.credit_balance)} FCFA</span>
          </p>
          <Field label="Montant reçu *">
            <input className="input tnum text-[18px]" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => setAmount(String(Math.round(c.credit_balance)))} className="seg seg-off flex-1 justify-center">Solde total</button>
          </div>
          <button onClick={pay} disabled={busy || !amount} className="btn-primary w-full">
            {busy ? <Spinner size={20} /> : "Valider le paiement"}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
