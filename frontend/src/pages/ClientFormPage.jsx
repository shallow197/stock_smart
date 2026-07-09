import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { Field, Spinner, FullLoader } from "../components/ui";
import Header from "../components/Header";

export default function ClientFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", phone: "+221 ", address: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (isEdit) {
      api.get(`/clients/${id}`).then((r) => {
        const c = r.data;
        setForm({ name: c.name, phone: c.phone || "", address: c.address || "" });
        setLoading(false);
      }).catch(() => { toast.error("Client introuvable."); navigate("/clients"); });
    }
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = { ...form, phone: form.phone.replace(/\s/g, "") };
    try {
      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
        toast.success("Client modifié.");
        navigate(`/clients/${id}`);
      } else {
        const r = await api.post("/clients", payload);
        toast.success("Client ajouté.");
        navigate(`/clients/${r.data.id}`);
      }
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (<div className="app-frame"><Header title="Chargement…" back /><FullLoader /></div>);

  return (
    <div className="app-frame lg:max-w-2xl min-h-full">
      <Header title={isEdit ? "Modifier le client" : "Nouveau client"} back />
      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        <Field label="Nom complet *" error={errors.name?.[0]}>
          <input className="input" placeholder="Fatou Ndiaye" value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Téléphone" error={errors.phone?.[0]}>
          <input className="input" inputMode="tel" placeholder="+221 77 555 12 34" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Adresse" error={errors.address?.[0]}>
          <input className="input" placeholder="Keur Massar, Dakar" value={form.address} onChange={set("address")} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={busy} className="btn-primary flex-[1.4]">
            {busy ? <Spinner size={20} /> : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
