import React from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Button, Card, Input, Select, Toast } from "../ui/controls";

const UNITS = ["pièce", "kg", "carton", "litre"];

function stockColor(q, t) {
  const qty = Number(q);
  const thr = Number(t);
  if (qty <= 0) return "text-rose-700";
  if (qty <= thr) return "text-orange-700";
  return "text-emerald-700";
}

export function ProductsPage() {
  const auth = useAuth();
  const [items, setItems] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    unit: "pièce",
    lowStockThreshold: "",
    isAvailable: true,
    photo: null,
  });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get(`/api/products?page=1&pageSize=50&q=${encodeURIComponent(q)}`, auth.token);
      setItems(res.products || []);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      if (form.description) fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.quantity) fd.append("quantity", form.quantity);
      fd.append("unit", form.unit);
      fd.append("isAvailable", String(form.isAvailable));
      if (form.lowStockThreshold) fd.append("lowStockThreshold", form.lowStockThreshold);
      if (form.photo) fd.append("photo", form.photo);

      await api.post("/api/products", fd, auth.token);
      setForm({
        name: "",
        category: "",
        description: "",
        price: "",
        quantity: "",
        unit: "pièce",
        lowStockThreshold: "",
        isAvailable: true,
        photo: null,
      });
      await load();
    } catch (e2) {
      setErr(e2.message || "Création impossible.");
    }
  }

  async function onDelete(id) {
    if (!confirm("Supprimer ce produit ?")) return;
    setErr("");
    try {
      await api.del(`/api/products/${id}`, auth.token);
      await load();
    } catch (e) {
      setErr(e.message || "Suppression impossible.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Produits</div>
        <button className="text-sm font-semibold text-violet-700 underline" onClick={load} disabled={loading}>
          {loading ? "…" : "Actualiser"}
        </button>
      </div>

      <Card>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Rechercher (nom, catégorie, description)…"
          />
          <button
            onClick={load}
            className="rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900"
          >
            OK
          </button>
        </div>
      </Card>

      {err ? <Toast kind="error">{err}</Toast> : null}

      <Card>
        <div className="mb-3 text-sm font-semibold">Ajouter un produit</div>
        <form onSubmit={onCreate} className="space-y-3">
          <Input label="Nom" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <Input label="Catégorie" value={form.category} onChange={(e) => set("category", e.target.value)} required />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optionnel"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix (F)" value={form.price} onChange={(e) => set("price", e.target.value)} required />
            <Input
              label="Quantité"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Unité" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
            <Input
              label="Seuil stock bas"
              value={form.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", e.target.value)}
              placeholder="Ex: 5"
            />
          </div>
          <label className="block">
            <div className="mb-1 text-sm font-medium text-zinc-700">Photo (1 image)</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => set("photo", e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => set("isAvailable", e.target.checked)}
            />
            Disponible
          </label>
          <Button>Ajouter</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {items.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.category}</div>
                <div className={`mt-1 text-sm font-semibold ${stockColor(p.quantity, p.lowStockThreshold)}`}>
                  Stock: {p.quantity} {p.unit}
                </div>
                <div className="text-sm text-zinc-700">Prix: {p.price} F</div>
              </div>
              <button className="text-sm font-semibold text-rose-700 underline" onClick={() => onDelete(p.id)}>
                Supprimer
              </button>
            </div>
          </Card>
        ))}
        {!items.length ? <div className="text-sm text-zinc-600">Aucun produit.</div> : null}
      </div>
    </div>
  );
}

