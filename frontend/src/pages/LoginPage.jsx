import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { Field, Spinner } from "../components/ui";
import { Icon } from "../lib/icons";
import Logo from "../components/Logo";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await login(form.login.trim(), form.password);
      navigate("/");
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-narrow min-h-full flex flex-col justify-center px-6 py-10">
      <div className="flex flex-col items-center text-center mb-8 animate-rise">
        <Logo size={72} />
        <h1 className="mt-4 text-[26px] font-extrabold text-brand-700 tracking-tight">EcoStock</h1>
        <p className="text-[13px] text-muted">Gestion intelligente de stock</p>
      </div>

      <form onSubmit={submit} className="card p-5 animate-rise" style={{ animationDelay: "60ms" }}>
        <h2 className="text-[19px] font-bold text-ink">Bon retour 👋</h2>
        <p className="text-[13px] text-muted mb-5">Connectez-vous pour gérer votre boutique.</p>

        <div className="space-y-4">
          <Field label="Email ou téléphone" error={errors.login?.[0]}>
            <input
              className="input"
              inputMode="email"
              autoCapitalize="none"
              placeholder="ousmane@boutique.sn"
              value={form.login}
              onChange={set("login")}
            />
          </Field>

          <Field label="Mot de passe" error={errors.password?.[0]}>
            <div className="relative">
              <input
                className="input pr-11"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted rounded-lg active:bg-line"
                aria-label={show ? "Masquer" : "Afficher"}
              >
                <Icon name={show ? "eyeOff" : "eye"} size={19} />
              </button>
            </div>
          </Field>
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full mt-6">
          {busy ? <Spinner size={20} /> : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-[14px] text-muted mt-6">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-bold text-brand-600">
          Créer un compte
        </Link>
      </p>

      <p className="text-center text-[12px] text-muted/70 mt-8">
        Démo : ousmane@boutique.sn · mot de passe <span className="font-semibold">password</span>
      </p>
    </div>
  );
}
