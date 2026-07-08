import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Button, Card, Input, Toast } from "../ui/controls";

export function ClientsPage() {
  const auth = useAuth();
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", address: "" });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function load() {
    setErr("");
    try {
      const res = await api.get(`/api/clients?page=1&pageSize=50&q=${encodeURIComponent(q)}`, auth.token);
      setItems(res.clients || []);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
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
      await api.post(
        "/api/clients",
        {
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address || undefined,
        },
        auth.token,
      );
      setForm({ name: "", phone: "", email: "", address: "" });
      await load();
    } catch (e2) {
      setErr(e2.message || "Création impossible.");
    }
  }

  async function onDelete(id) {
    if (!confirm("Supprimer ce client ?")) return;
    setErr("");
    try {
      await api.del(`/api/clients/${id}`, auth.token);
      await load();
    } catch (e) {
      setErr(e.message || "Suppression impossible.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">Clients</div>

      <Card>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Rechercher (nom, tel, email)…"
          />
          <button onClick={load} className="rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900">
            OK
          </button>
        </div>
      </Card>

      {err ? <Toast kind="error">{err}</Toast> : null}

      <Card>
        <div className="mb-3 text-sm font-semibold">Ajouter un client</div>
        <form onSubmit={onCreate} className="space-y-3">
          <Input label="Nom" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <Input label="Téléphone" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          <Input label="Email (optionnel)" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Adresse (optionnel)" value={form.address} onChange={(e) => set("address", e.target.value)} />
          <Button>Ajouter</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {items.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link className="text-sm font-bold text-violet-700 underline" to={`/clients/${c.id}`}>
                  {c.name}
                </Link>
                <div className="text-sm text-zinc-700">{c.phone}</div>
                {c.email ? <div className="text-xs text-zinc-500">{c.email}</div> : null}
              </div>
              <button className="text-sm font-semibold text-rose-700 underline" onClick={() => onDelete(c.id)}>
                Supprimer
              </button>
            </div>
          </Card>
        ))}
        {!items.length ? <div className="text-sm text-zinc-600">Aucun client.</div> : null}
      </div>
    </div>
  );
}

