import React from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Button, Card, Input, Select, Toast } from "../ui/controls";

const TYPES = ["ARRIVAGE", "VENTE", "RETOUR", "AJUSTEMENT", "NOTE"];

export function LogTodayPage() {
  const auth = useAuth();
  const [log, setLog] = React.useState(null);
  const [dateKey, setDateKey] = React.useState("");
  const [products, setProducts] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [form, setForm] = React.useState({
    type: "VENTE",
    productId: "",
    clientId: "",
    clientName: "",
    quantity: "",
    unitPrice: "",
    note: "",
  });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function load() {
    setErr("");
    try {
      const [l, ps, cs] = await Promise.all([
        api.get("/api/logs/today", auth.token),
        api.get("/api/products?page=1&pageSize=100", auth.token),
        api.get("/api/clients?page=1&pageSize=100", auth.token),
      ]);
      setLog(l.log);
      setDateKey(l.dateKey);
      setProducts(ps.products || []);
      setClients(cs.clients || []);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd(e) {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        type: form.type,
        productId: form.productId ? Number(form.productId) : undefined,
        clientId: form.clientId ? Number(form.clientId) : undefined,
        clientName: form.clientName || undefined,
        quantity: form.quantity || undefined,
        unitPrice: form.unitPrice || undefined,
        note: form.note || undefined,
      };
      await api.post("/api/logs/entries", payload, auth.token);
      setForm((f) => ({ ...f, quantity: "", unitPrice: "", note: "" }));
      await load();
    } catch (e2) {
      setErr(e2.message || "Ajout impossible.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Journal du jour</div>
          <div className="text-lg font-bold">{dateKey || "—"}</div>
        </div>
        <button className="text-sm font-semibold text-violet-700 underline" onClick={load}>
          Actualiser
        </button>
      </div>

      {err ? <Toast kind="error">{err}</Toast> : null}

      <Card>
        <div className="mb-3 text-sm font-semibold">Ajouter une entrée</div>
        <form onSubmit={onAdd} className="space-y-3">
          <Select label="Type" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          {form.type !== "NOTE" ? (
            <Select label="Produit" value={form.productId} onChange={(e) => set("productId", e.target.value)}>
              <option value="">— Choisir —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          ) : null}

          <Select label="Client (optionnel)" value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
            <option value="">— Aucun —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </Select>

          <Input
            label="Nom client libre (optionnel)"
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="Si client non enregistré"
          />

          {form.type === "NOTE" ? (
            <Input label="Note" value={form.note} onChange={(e) => set("note", e.target.value)} required />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Quantité" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              <Input label="Prix unitaire (F)" value={form.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} />
            </div>
          )}

          <Button>Ajouter</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-2 text-sm font-semibold">Entrées</div>
        {log?.entries?.length ? (
          <div className="space-y-2">
            {log.entries.map((e) => (
              <div key={e.id} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{e.type}</div>
                  <div className="text-xs text-zinc-500">{new Date(e.timestamp).toLocaleString("fr-FR")}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-700">
                  {e.product?.name ? <span className="font-medium">{e.product.name}</span> : <span>—</span>}
                  {e.total ? <span className="ml-2 text-zinc-900">{e.total} F</span> : null}
                </div>
                {e.invoiceNumber ? <div className="text-xs text-zinc-500">{e.invoiceNumber}</div> : null}
                {e.note ? <div className="mt-1 text-xs text-zinc-600">{e.note}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Aucune entrée aujourd’hui.</div>
        )}
      </Card>
    </div>
  );
}

