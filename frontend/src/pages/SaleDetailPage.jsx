import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { money, qty, dateLong, time } from "../lib/format";
import { FullLoader, Avatar } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";
import { useToast } from "../components/Toast";

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, reload } = useApi(`/sales/${id}`, [id]);

  if (loading || !data) {
    return (<div className="app-frame"><Header title="Vente" back /><FullLoader /></div>);
  }
  const s = data.data;
  const cancelled = s.status === "cancelled";

  async function cancel() {
    if (!confirm("Annuler cette vente ? Le stock sera restauré.")) return;
    try {
      await api.post(`/sales/${id}/cancel`);
      toast.success("Vente annulée, stock restauré.");
      reload();
    } catch (e) { toast.error(e.message); }
  }
   async function downloadReceipt() {
    try {
      const token = localStorage.getItem("ecostock_token");
      const res = await fetch(`/api/sales/${id}/receipt/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Impossible de générer le ticket.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${s.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function shareReceipt() {
    try {
      const r = await api.post(`/sales/${id}/receipt/share`);
      await navigator.clipboard.writeText(r.url);
      toast.success("Lien copié dans le presse-papier !");
    } catch (e) {
      toast.error(e.message || "Impossible de générer le lien.");
    }
  }

  return (
    <div className="app-frame lg:max-w-3xl min-h-full pb-8">
      <Header title="Détail de la vente" subtitle={s.invoice_number} back />

      <div className="px-4 -mt-6 space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-muted">Total{cancelled ? " (annulée)" : ""}</p>
              <p className={`text-[28px] font-extrabold tnum leading-none ${cancelled ? "text-muted line-through" : "text-brand-700"}`}>
                {money(s.total)} <span className="text-[15px]">FCFA</span>
              </p>
            </div>
            {cancelled ? (
              <span className="chip bg-line text-muted">Annulée</span>
            ) : s.payment_method === "credit" ? (
              <span className="chip chip-warn">À crédit</span>
            ) : (
              <span className="chip chip-ok">Payé comptant</span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-y-2 text-[13px]">
            <span className="text-muted">Date</span>
            <span className="text-right font-medium text-ink">{dateLong(s.sold_at)}</span>
            <span className="text-muted">Heure</span>
            <span className="text-right font-medium text-ink tnum">{time(s.sold_at)}</span>
            <span className="text-muted">Client</span>
            <span className="text-right font-medium text-ink">{s.client_name || "Comptant"}</span>
            {s.payment_method === "credit" && (
              <>
                <span className="text-muted">Reste à payer</span>
                <span className="text-right font-bold text-warn tnum">{money(s.outstanding)} F</span>
              </>
            )}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-[15px] font-bold text-ink mb-1">Articles ({s.items?.length || 0})</h2>
          <ul className="divide-y divide-line">
            {s.items?.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5">
                <Avatar label={it.product_name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-ink truncate">{it.product_name}</p>
                  <p className="text-[12px] text-muted tnum">{money(it.unit_price)} × {qty(it.quantity)}</p>
                </div>
                <span className="text-[14px] font-bold tnum text-ink">{money(it.line_total)} F</span>
              </li>
            ))}
          </ul>
        </div>

        {s.client_id && (
          <button onClick={() => navigate(`/clients/${s.client_id}`)} className="btn-secondary w-full">
            <Icon name="user" size={18} /> Voir la fiche client
          </button>
        )}
        {!cancelled && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={downloadReceipt} className="btn-secondary">
            <Icon name="receipt" size={18} /> Ticket PDF
          </button>
          <button onClick={shareReceipt} className="btn-secondary">
            <Icon name="share" size={18} /> Partager
          </button>
        </div>
      )}

        {!cancelled && (
          <button onClick={cancel} className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold text-danger py-3">
            <Icon name="refresh" size={18} /> Annuler la vente
          </button>
        )}
      </div>
    </div>
  );
}
