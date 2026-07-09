import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { money, qty } from "../lib/format";
import { FullLoader, EmptyState, Avatar, SearchBar, Segmented, Fab, ProductStatusChip } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { data, loading } = useApi("/products");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [cat, setCat] = useState(null);

  const products = data?.data || [];
  const counts = data?.counts || { all: 0, alert: 0, out: 0 };

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => p.category && map.set(p.category.id, p.category.name));
    return [...map.entries()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (cat && p.category?.id !== cat) return false;
      if (tab === "alert" && p.stock_status === "normal") return false;
      if (tab === "out" && p.stock_status !== "out") return false;
      return true;
    });
  }, [products, search, tab, cat]);

  return (
    <div>
      <Header
        title="Mon stock"
        subtitle={`${counts.all} produits · ${counts.alert} en alerte`}
      />

      <div className="px-4 pt-4 space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un produit…" />
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "Tous", count: counts.all },
            { value: "alert", label: "Alerte", count: counts.alert },
            { value: "out", label: "Rupture", count: counts.out },
          ]}
        />
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCat(null)}
              className={`seg ${cat === null ? "bg-brand-50 text-brand-700 border border-brand-200" : "seg-off"}`}
            >
              Toutes catégories
            </button>
            {categories.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setCat(cat === id ? null : id)}
                className={`seg ${cat === id ? "bg-brand-50 text-brand-700 border border-brand-200" : "seg-off"}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <FullLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="box"
          title="Aucun produit"
          hint={search || tab !== "all" || cat ? "Aucun résultat pour ces filtres." : "Ajoutez votre premier produit au catalogue."}
          action={
            !search && tab === "all" && !cat ? (
              <button onClick={() => navigate("/stock/nouveau")} className="btn-primary px-5">
                <Icon name="plus" size={18} /> Ajouter un produit
              </button>
            ) : null
          }
        />
      ) : (
        <ul className="px-4 lg:px-6 mt-1 space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 pb-4">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => navigate(`/stock/${p.id}`)}
                className="card w-full p-3 flex items-center gap-3 text-left active:scale-[0.99] transition"
              >
                {p.photo_url ? (
                  <img src={p.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-line" />
                ) : (
                  <Avatar label={p.name} size={48} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink truncate">{p.name}</p>
                  <p className="text-[12px] text-muted truncate">
                    {p.category?.name || "Sans catégorie"} · Stock : {qty(p.stock)} {p.unit || ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[14px] font-bold tnum text-ink">{money(p.sale_price)} F</span>
                  <ProductStatusChip status={p.stock_status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => navigate("/stock/nouveau")} label="Ajouter un produit" />
    </div>
  );
}
