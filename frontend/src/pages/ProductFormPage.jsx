import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { Field, Spinner, Sheet, FullLoader } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [catSheet, setCatSheet] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [preview, setPreview] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [form, setForm] = useState({
    name: "", category_id: "", purchase_price: "", sale_price: "",
    stock: "", alert_threshold: "", unit: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    if (isEdit) {
      api.get(`/products/${id}`).then((r) => {
        const p = r.data;
        setForm({
          name: p.name, category_id: p.category_id || "",
          purchase_price: p.purchase_price, sale_price: p.sale_price,
          stock: "", alert_threshold: p.alert_threshold, unit: p.unit || "",
        });
        if (p.photo_url) setPreview(p.photo_url);
        setLoading(false);
      }).catch(() => { toast.error("Produit introuvable."); navigate("/stock"); });
    }
  }, [id]);

  function pickPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  }

  async function createCategory() {
    if (!newCat.trim()) return;
    try {
      const r = await api.post("/categories", { name: newCat.trim() });
      setCategories((c) => [...c, r.data]);
      setForm((f) => ({ ...f, category_id: r.data.id }));
      setNewCat("");
      setCatSheet(false);
      toast.success("Catégorie créée.");
    } catch (e) {
      toast.error(e.errors?.name?.[0] || "Impossible de créer la catégorie.");
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.category_id) fd.append("category_id", form.category_id);
    fd.append("purchase_price", form.purchase_price || 0);
    fd.append("sale_price", form.sale_price || 0);
    fd.append("alert_threshold", form.alert_threshold || 0);
    if (form.unit) fd.append("unit", form.unit);
    if (!isEdit) fd.append("stock", form.stock || 0);
    if (photo) fd.append("photo", photo);

    try {
      if (isEdit) {
        await api.upload(`/products/${id}`, fd);
        toast.success("Produit modifié.");
      } else {
        await api.upload("/products", fd);
        toast.success("Produit ajouté.");
      }
      navigate(isEdit ? `/stock/${id}` : "/stock");
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (<div className="app-frame"><Header title="Chargement…" back /><FullLoader /></div>);
  }

  const catName = categories.find((c) => String(c.id) === String(form.category_id))?.name;

  return (
    <div className="app-frame lg:max-w-2xl min-h-full pb-8">
      <Header title={isEdit ? "Modifier le produit" : "Nouveau produit"} subtitle={isEdit ? form.name : "Ajouter au catalogue"} back />

      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="" className="w-28 h-28 rounded-2xl object-cover border border-line" />
                <span className="absolute -bottom-1 -right-1 grid place-items-center w-8 h-8 rounded-full bg-brand-600 text-white shadow">
                  <Icon name="camera" size={16} />
                </span>
              </div>
            ) : (
              <div className="grid place-items-center w-28 h-28 rounded-2xl border-2 border-dashed border-brand-300 text-brand-500 bg-brand-50/50">
                <div className="flex flex-col items-center gap-1">
                  <Icon name="camera" size={22} />
                  <span className="text-[12px] font-semibold">Photo</span>
                </div>
              </div>
            )}
          </label>
        </div>

        <Field label="Nom du produit *" error={errors.name?.[0]}>
          <input className="input" placeholder="Riz parfumé 25 kg" value={form.name} onChange={set("name")} />
        </Field>

        <Field label="Catégorie">
          <button type="button" onClick={() => setCatSheet(true)} className="input flex items-center justify-between text-left">
            <span className={catName ? "text-ink" : "text-muted/60"}>{catName || "Choisir une catégorie"}</span>
            <Icon name="chevronD" size={18} className="text-muted" />
          </button>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix d'achat" error={errors.purchase_price?.[0]}>
            <input className="input tnum" inputMode="numeric" placeholder="13 200" value={form.purchase_price} onChange={set("purchase_price")} />
          </Field>
          <Field label="Prix de vente *" error={errors.sale_price?.[0]}>
            <input className="input tnum" inputMode="numeric" placeholder="14 500" value={form.sale_price} onChange={set("sale_price")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!isEdit && (
            <Field label="Stock initial" error={errors.stock?.[0]}>
              <input className="input tnum" inputMode="numeric" placeholder="50" value={form.stock} onChange={set("stock")} />
            </Field>
          )}
          <Field label="Seuil d'alerte" error={errors.alert_threshold?.[0]}>
            <input className="input tnum" inputMode="numeric" placeholder="10" value={form.alert_threshold} onChange={set("alert_threshold")} />
          </Field>
          {isEdit && (
            <Field label="Unité" error={errors.unit?.[0]}>
              <input className="input" placeholder="sac, bidon…" value={form.unit} onChange={set("unit")} />
            </Field>
          )}
        </div>

        {!isEdit && (
          <Field label="Unité" error={errors.unit?.[0]}>
            <input className="input" placeholder="sac, bidon, unité…" value={form.unit} onChange={set("unit")} />
          </Field>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={busy} className="btn-primary flex-[1.4]">
            {busy ? <Spinner size={20} /> : "Enregistrer"}
          </button>
        </div>
      </form>

      <Sheet open={catSheet} onClose={() => setCatSheet(false)} title="Catégorie">
        <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setForm((f) => ({ ...f, category_id: c.id })); setCatSheet(false); }}
              className={`w-full flex items-center justify-between px-3.5 h-12 rounded-xl text-left text-[15px] ${
                String(form.category_id) === String(c.id) ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink active:bg-line"
              }`}
            >
              {c.name}
              {String(form.category_id) === String(c.id) && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-t border-line pt-4">
          <input className="input" placeholder="Nouvelle catégorie…" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button type="button" onClick={createCategory} className="btn-primary px-4">
            <Icon name="plus" size={18} />
          </button>
        </div>
      </Sheet>
    </div>
  );
}
