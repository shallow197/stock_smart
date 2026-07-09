import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { Field, Spinner } from "../components/ui";
import { Icon } from "../lib/icons";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "+221 ", email: "", shop_name: "",
    password: "", password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await register({ ...form, phone: form.phone.replace(/\s/g, "") });
      toast.success("Bienvenue sur EcoStock !");
      navigate("/");
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || "Inscription impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-narrow min-h-full">
      <header
        className="sticky top-0 z-20 text-white rounded-b-3xl pt-safe"
        style={{ background: "linear-gradient(150deg, #2e8b57, #1e5f4f)" }}
      >
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-5">
          <Link to="/login" className="grid place-items-center w-9 h-9 -ml-1.5 rounded-full active:bg-white/15">
            <Icon name="back" size={22} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-[19px] font-bold leading-tight">Créer un compte</h1>
            <p className="text-[13px] text-white/70">Une boutique = un compte</p>
          </div>
        </div>
      </header>

      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        <Field label="Nom complet" error={errors.name?.[0]}>
          <input className="input" placeholder="Ousmane Diallo" value={form.name} onChange={set("name")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone" error={errors.phone?.[0]}>
            <input className="input" inputMode="tel" placeholder="+221 77 123 45 67" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email" error={errors.email?.[0]}>
            <input className="input" inputMode="email" autoCapitalize="none" placeholder="ousmane@boutique.sn" value={form.email} onChange={set("email")} />
          </Field>
        </div>

        <Field label="Nom de la boutique" error={errors.shop_name?.[0]}>
          <input className="input" placeholder="Boutique Keur Massar" value={form.shop_name} onChange={set("shop_name")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mot de passe" error={errors.password?.[0]}>
            <input className="input" type="password" placeholder="••••••" value={form.password} onChange={set("password")} />
          </Field>
          <Field label="Confirmer" error={errors.password_confirmation?.[0]}>
            <input className="input" type="password" placeholder="••••••" value={form.password_confirmation} onChange={set("password_confirmation")} />
          </Field>
        </div>

        <p className="text-[12px] text-muted leading-relaxed">
          En créant un compte, vous acceptez les conditions d'utilisation d'EcoStock.
        </p>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? <Spinner size={20} /> : "Créer mon compte"}
        </button>

        <p className="text-center text-[14px] text-muted pt-1">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-bold text-brand-600">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
