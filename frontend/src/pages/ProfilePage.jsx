import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { Field, Spinner } from "../components/ui";
import Header from "../components/Header";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name || "", phone: user.phone || "", email: user.email || "",
    shop_name: user.shop_name || "", shop_address: user.shop_address || "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const r = await api.put("/profile", { ...form, phone: form.phone.replace(/\s/g, "") });
      setUser(r.user);
      toast.success("Profil mis à jour.");
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || "Enregistrement impossible.");
    } finally { setBusy(false); }
  }

  return (
    <div className="app-frame lg:max-w-2xl min-h-full">
      <Header title="Profil & boutique" back />
      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Commerçant</p>
        <Field label="Nom complet" error={errors.name?.[0]}>
          <input className="input" value={form.name} onChange={set("name")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone" error={errors.phone?.[0]}>
            <input className="input" inputMode="tel" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email" error={errors.email?.[0]}>
            <input className="input" inputMode="email" autoCapitalize="none" value={form.email} onChange={set("email")} />
          </Field>
        </div>

        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide pt-2">Boutique</p>
        <Field label="Nom de la boutique" error={errors.shop_name?.[0]}>
          <input className="input" value={form.shop_name} onChange={set("shop_name")} />
        </Field>
        <Field label="Adresse" error={errors.shop_address?.[0]}>
          <input className="input" placeholder="Keur Massar, Dakar" value={form.shop_address} onChange={set("shop_address")} />
        </Field>

        <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
          {busy ? <Spinner size={20} /> : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
