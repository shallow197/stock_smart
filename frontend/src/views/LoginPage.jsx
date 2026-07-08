import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Button, Card, FieldRow, Input, Toast } from "../ui/controls";

export function LoginPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await auth.login({ email, password });
      const to = loc.state?.from || "/dashboard";
      nav(to, { replace: true });
    } catch (e2) {
      setErr(e2.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-3">
        <FieldRow>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </FieldRow>
        {err ? <Toast kind="error">{err}</Toast> : null}
        <Button disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</Button>
        <div className="text-center text-sm text-zinc-600">
          Pas de compte ?{" "}
          <Link className="font-semibold text-violet-700 underline" to="/register">
            Créer un compte
          </Link>
        </div>
      </form>
    </Card>
  );
}

