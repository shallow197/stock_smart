import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { Field, Spinner } from "../components/ui";
import Header from "../components/Header";

export default function SecurityPage() {
  const toast = useToast();
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await api.put("/password", form);
      toast.success("Mot de passe modifié.");
      setForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || "Modification impossible.");
    } finally { setBusy(false); }
  }

  return (
    <div className="app-frame lg:max-w-2xl min-h-full">
      <Header title="Sécurité" back />
      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        <Field label="Mot de passe actuel" error={errors.current_password?.[0]}>
          <input className="input" type="password" value={form.current_password} onChange={set("current_password")} />
        </Field>
        <Field label="Nouveau mot de passe" error={errors.password?.[0]}>
          <input className="input" type="password" value={form.password} onChange={set("password")} />
        </Field>
        <Field label="Confirmer le nouveau mot de passe" error={errors.password_confirmation?.[0]}>
          <input className="input" type="password" value={form.password_confirmation} onChange={set("password_confirmation")} />
        </Field>
        <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
          {busy ? <Spinner size={20} /> : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}
