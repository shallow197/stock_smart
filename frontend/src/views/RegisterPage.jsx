import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Button, Card, FieldRow, Input, Toast } from "../ui/controls";

export function RegisterPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [form, setForm] = React.useState({
    shopName: "",
    ownerName: "",
    email: "",
    password: "",
    category: "",
  });
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await auth.register(form);
      nav("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Création impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-3">
        <FieldRow>
          <Input label="Nom de la boutique" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} />
          <Input label="Nom du propriétaire" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
          <Input label="Catégorie" value={form.category} onChange={(e) => set("category", e.target.value)} />
          <Input label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
          <Input
            label="Mot de passe (6+)"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            autoComplete="new-password"
          />
        </FieldRow>
        {err ? <Toast kind="error">{err}</Toast> : null}
        <Button disabled={loading}>{loading ? "Création…" : "Créer mon compte"}</Button>
        <div className="text-center text-sm text-zinc-600">
          Déjà inscrit ?{" "}
          <Link className="font-semibold text-violet-700 underline" to="/login">
            Se connecter
          </Link>
        </div>
      </form>
    </Card>
  );
}

