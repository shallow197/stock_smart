import React from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Button, Card, Input, Toast } from "../ui/controls";

export function SettingsPage() {
  const auth = useAuth();
  const [shop, setShop] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const [form, setForm] = React.useState({ shopName: "", ownerName: "", category: "" });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function load() {
    setErr("");
    setOk("");
    try {
      const res = await api.get("/api/settings/shop", auth.token);
      setShop(res.shop);
      setForm({
        shopName: res.shop?.shopName || "",
        ownerName: res.shop?.ownerName || "",
        category: res.shop?.category || "",
      });
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    try {
      const res = await api.put(
        "/api/settings/shop",
        { shopName: form.shopName, ownerName: form.ownerName, category: form.category },
        auth.token,
      );
      setShop(res.shop);
      setOk("Enregistré.");
    } catch (e2) {
      setErr(e2.message || "Enregistrement impossible.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">Réglages</div>

      {err ? <Toast kind="error">{err}</Toast> : null}
      {ok ? <Toast kind="success">{ok}</Toast> : null}

      <Card>
        <div className="mb-2 text-sm font-semibold">Boutique</div>
        <form onSubmit={onSave} className="space-y-3">
          <Input label="Nom boutique" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} />
          <Input label="Propriétaire" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
          <Input label="Catégorie" value={form.category} onChange={(e) => set("category", e.target.value)} />
          <Button>Enregistrer</Button>
        </form>
      </Card>

      <Card>
        <div className="text-sm text-zinc-700">
          <div className="font-semibold">{shop?.email || auth.user?.email || "—"}</div>
          <div className="text-xs text-zinc-500">Compte vendeur</div>
        </div>
        <div className="mt-3">
          <Button variant="danger" onClick={auth.logout}>
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  );
}

