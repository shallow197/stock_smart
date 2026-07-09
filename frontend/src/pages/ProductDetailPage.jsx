import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { money, qty, dateShort, time } from "../lib/format";
import { FullLoader, Avatar, ProductStatusChip, Sheet, Field, Spinner, IconButton } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";
import { useToast } from "../components/Toast";

const MOVE_META = {
  initial: { icon: "box", label: "Stock initial", tone: "text-brand-600" },
  entry: { icon: "in", label: "Entrée de stock", tone: "text-brand-600" },
  sale: { icon: "cart", label: "Vente", tone: "text-danger" },
  adjustment: { icon: "adjust", label: "Ajustement", tone: "text-amber-600" },
  cancellation: { icon: "refresh", label: "Annulation de vente", tone: "text-brand-600" },
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, reload } = useApi(`/products/${id}`, [id]);
  const [sheet, setSheet] = useState(null); // 'entry' | 'adjust'
  const [busy, setBusy] = useState(false);
  const [entry, setEntry] = useState({ quantity: "", unit_cost: "", reason: "" });
  const [adjust, setAdjust] = useState({ new_stock: "", reason: "" });

  if (loading || !data) {
    return (<div className="app-frame"><Header title="Produit" back /><FullLoader /></div>);
  }
  const p = data.data;
  const movements = data.movements || [];
  const margin = p.sale_price - p.purchase_price;

  async function submitEntry() {
    setBusy(true);
    try {
      await api.post(`/products/${id}/stock-entry`, {
        quantity: Number(entry.quantity),
        unit_cost: entry.unit_cost ? Number(entry.unit_cost) : undefined,
        reason: entry.reason || undefined,
      });
      toast.success("Entrée de stock enregistrée.");
      setSheet(null); setEntry({ quantity: "", unit_cost: "", reason: "" });
      reload();
    } catch (e) { toast.error(e.errors?.quantity?.[0] || e.message); }
    finally { setBusy(false); }
  }

  async function submitAdjust() {
    setBusy(true);
    try {
      await api.post(`/products/${id}/adjust`, {
        new_stock: Number(adjust.new_stock),
        reason: adjust.reason || undefined,
      });
      toast.success("Stock ajusté.");
      setSheet(null); setAdjust({ new_stock: "", reason: "" });
      reload();
    } catch (e) { toast.error(e.errors?.new_stock?.[0] || e.message); }
    finally { setBusy(false); }
  }

  async function archive() {
    if (!confirm("Archiver ce produit ? Son historique est conservé.")) return;
    try {
      await api.del(`/products/${id}`);
      toast.success("Produit archivé.");
      navigate("/stock");
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="app-frame lg:max-w-5xl min-h-full pb-8">
      <Header
        title={p.name}
        subtitle={p.category?.name || "Sans catégorie"}
        back
        right={<IconButton icon="edit" onClick={() => navigate(`/stock/${id}/modifier`)} className="bg-white/15 text-white" size={20} label="Modifier" />}
      />

      <div className="px-4 -mt-6 space-y-4">
        {/* Carte produit */}
        <div className="card p-4">
          <div className="flex items-center gap-4">
            {p.photo_url ? (
              <img src={p.photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover bg-line" />
            ) : (
              <Avatar label={p.name} size={80} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ProductStatusChip status={p.stock_status} />
              </div>
              <p className="text-[26px] font-extrabold tnum text-ink leading-none">
                {qty(p.stock)} <span className="text-[15px] font-semibold text-muted">{p.unit || "en stock"}</span>
              </p>
              <p className="text-[12px] text-muted mt-1">Seuil d'alerte : {qty(p.alert_threshold)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-line text-center">
            <div>
              <p className="text-[11px] text-muted">Prix d'achat</p>
              <p className="text-[15px] font-bold tnum text-ink">{money(p.purchase_price)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Prix de vente</p>
              <p className="text-[15px] font-bold tnum text-ink">{money(p.sale_price)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Marge</p>
              <p className={`text-[15px] font-bold tnum ${margin >= 0 ? "text-brand-600" : "text-danger"}`}>{money(margin)}</p>
            </div>
          </div>
        </div>

        {/* Actions stock */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setSheet("entry")} className="btn-secondary">
            <Icon name="in" size={19} /> Entrée
          </button>
          <button onClick={() => setSheet("adjust")} className="btn-secondary">
            <Icon name="adjust" size={19} /> Ajuster
          </button>
        </div>

        {/* Historique des mouvements */}
        <div className="card p-4">
          <h2 className="text-[15px] font-bold text-ink mb-1">Mouvements de stock</h2>
          {movements.length === 0 ? (
            <p className="text-[13px] text-muted py-6 text-center">Aucun mouvement enregistré.</p>
          ) : (
            <ul className="divide-y divide-line">
              {movements.map((m) => {
                const meta = MOVE_META[m.type] || MOVE_META.adjustment;
                const q = Number(m.quantity);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <span className={`grid place-items-center w-9 h-9 rounded-full bg-brand-50 ${meta.tone}`}>
                      <Icon name={meta.icon} size={17} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink">{meta.label}</p>
                      <p className="text-[12px] text-muted">
                        {dateShort(m.occurred_at)} · {time(m.occurred_at)}{m.reason ? ` · ${m.reason}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[14px] font-bold tnum ${q >= 0 ? "text-brand-600" : "text-danger"}`}>
                        {q >= 0 ? "+" : "−"}{qty(Math.abs(q))}
                      </p>
                      <p className="text-[11px] text-muted tnum">→ {qty(m.stock_after)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button onClick={archive} className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold text-danger py-3">
          <Icon name="trash" size={18} /> Archiver le produit
        </button>
      </div>

      {/* Sheet entrée de stock */}
      <Sheet open={sheet === "entry"} onClose={() => setSheet(null)} title="Entrée de stock">
        <div className="space-y-4">
          <Field label="Quantité reçue *">
            <input className="input tnum" inputMode="numeric" placeholder="20" value={entry.quantity} onChange={(e) => setEntry({ ...entry, quantity: e.target.value })} />
          </Field>
          <Field label="Prix d'achat unitaire" hint="Met à jour la marge du produit.">
            <input className="input tnum" inputMode="numeric" placeholder={String(p.purchase_price)} value={entry.unit_cost} onChange={(e) => setEntry({ ...entry, unit_cost: e.target.value })} />
          </Field>
          <Field label="Note (fournisseur…)">
            <input className="input" placeholder="Livraison Grand Marché" value={entry.reason} onChange={(e) => setEntry({ ...entry, reason: e.target.value })} />
          </Field>
          <button onClick={submitEntry} disabled={busy || !entry.quantity} className="btn-primary w-full">
            {busy ? <Spinner size={20} /> : "Enregistrer l'entrée"}
          </button>
        </div>
      </Sheet>

      {/* Sheet ajustement */}
      <Sheet open={sheet === "adjust"} onClose={() => setSheet(null)} title="Ajustement d'inventaire">
        <div className="space-y-4">
          <p className="text-[13px] text-muted">Stock actuel : <span className="font-semibold text-ink">{qty(p.stock)} {p.unit}</span></p>
          <Field label="Nouveau stock réel *">
            <input className="input tnum" inputMode="numeric" placeholder="0" value={adjust.new_stock} onChange={(e) => setAdjust({ ...adjust, new_stock: e.target.value })} />
          </Field>
          <Field label="Motif">
            <input className="input" placeholder="Casse, inventaire…" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
          </Field>
          <button onClick={submitAdjust} disabled={busy || adjust.new_stock === ""} className="btn-primary w-full">
            {busy ? <Spinner size={20} /> : "Valider l'ajustement"}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
