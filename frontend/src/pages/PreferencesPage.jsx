import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { Field, Spinner } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

const DATE_FORMATS = [
  { value: "d/m/Y", label: "31/12/2026" },
  { value: "Y-m-d", label: "2026-12-31" },
  { value: "d M Y", label: "31 déc. 2026" },
];

export default function PreferencesPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    currency: user.currency || "FCFA",
    date_format: user.date_format || "d/m/Y",
    timezone: user.timezone || "Africa/Dakar",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.put("/preferences", form);
      setUser(r.user);
      toast.success("Préférences enregistrées.");
    } catch (err) {
      toast.error(err.message || "Enregistrement impossible.");
    } finally { setBusy(false); }
  }

  return (
    <div className="app-frame lg:max-w-2xl min-h-full">
      <Header title="Préférences" back />
      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        <Field label="Devise" hint="Le franc CFA est la devise par défaut du marché.">
          <input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </Field>

        <Field label="Format de date">
          <div className="space-y-2">
            {DATE_FORMATS.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setForm({ ...form, date_format: f.value })}
                className={`w-full flex items-center justify-between px-3.5 h-12 rounded-xl border text-[15px] ${
                  form.date_format === f.value ? "border-brand-400 bg-brand-50 text-brand-700 font-semibold" : "border-line text-ink"
                }`}
              >
                {f.label}
                {form.date_format === f.value && <Icon name="check" size={18} />}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Fuseau horaire">
          <input className="input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        </Field>

        <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
          {busy ? <Spinner size={20} /> : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
