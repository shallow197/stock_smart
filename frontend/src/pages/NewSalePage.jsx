import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { money, qty, initials, avatarTone } from "../lib/format";
import { Avatar, Sheet, Spinner, SearchBar, EmptyState } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";
import { useToast } from "../components/Toast";

export default function NewSalePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState({}); // id -> { product, qty }
  const [client, setClient] = useState(null);
  const [search, setSearch] = useState("");
  const [clientSheet, setClientSheet] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data.filter((p) => Number(p.stock) > 0))).catch(() => {});
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  const results = useMemo(() => {
    if (!search.trim()) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6);
  }, [search, products]);

  const items = Object.values(cart);
  const total = items.reduce((s, it) => s + it.product.sale_price * it.qty, 0);
  const count = items.reduce((s, it) => s + it.qty, 0);

  function addProduct(p) {
    setCart((c) => {
      const cur = c[p.id]?.qty || 0;
      if (cur + 1 > Number(p.stock)) {
        toast.error(`Stock maximum atteint pour ${p.name}.`);
        return c;
      }
      return { ...c, [p.id]: { product: p, qty: cur + 1 } };
    });
    setSearch("");
  }

  function changeQty(id, delta) {
    setCart((c) => {
      const it = c[id];
      if (!it) return c;
      const next = it.qty + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      if (next > Number(it.product.stock)) {
        toast.error("Stock insuffisant.");
        return c;
      }
      return { ...c, [id]: { ...it, qty: next } };
    });
  }

  async function submit(method) {
    if (items.length === 0) return toast.error("Le panier est vide.");
    if (method === "credit" && !client) {
      toast.error("Une vente à crédit nécessite un client.");
      setClientSheet(true);
      return;
    }
    setBusy(true);
    try {
      const payload = {
        items: items.map((it) => ({ product_id: it.product.id, quantity: it.qty })),
        payment_method: method,
        client_id: client?.id || null,
      };
      const r = await api.post("/sales", payload);
      toast.success(method === "credit" ? "Vente à crédit enregistrée." : "Vente encaissée.");
      navigate(`/ventes/${r.data.id}`, { replace: true });
    } catch (e) {
      toast.error(e.errors?.items?.[0] || e.message || "Vente impossible.");
    } finally {
      setBusy(false);
    }
  }

  const filteredClients = clients.filter(
    (c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone || "").includes(clientSearch)
  );

  return (
    <div className="app-frame lg:max-w-3xl min-h-full flex flex-col">
      <Header
        title="Nouvelle vente"
        subtitle={`${count} article${count > 1 ? "s" : ""} dans le panier`}
        back
        right={
          <button className="grid place-items-center w-10 h-10 rounded-full bg-white/15 opacity-60" title="Saisie vocale (bientôt)" aria-label="Micro">
            <Icon name="mic" size={20} />
          </button>
        }
      />

      <div className="flex-1 px-4 pt-4 pb-44">
        {/* Recherche produit */}
        <div className="relative">
          <SearchBar value={search} onChange={setSearch} placeholder="Ajouter un produit…" />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 inset-x-0 card p-1.5 max-h-72 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl text-left active:bg-brand-50"
                >
                  <Avatar label={p.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink truncate">{p.name}</p>
                    <p className="text-[12px] text-muted">Stock : {qty(p.stock)} {p.unit}</p>
                  </div>
                  <span className="text-[13px] font-bold tnum text-brand-700">{money(p.sale_price)} F</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panier */}
        {items.length === 0 ? (
          <EmptyState icon="cart" title="Panier vide" hint="Recherchez un produit ci-dessus pour l'ajouter à la vente." />
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((it) => (
              <li key={it.product.id} className="card p-3 flex items-center gap-3">
                <Avatar label={it.product.name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-ink truncate">{it.product.name}</p>
                  <p className="text-[12px] text-muted tnum">
                    {money(it.product.sale_price)} × {it.qty} = <span className="font-semibold text-ink">{money(it.product.sale_price * it.qty)} F</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(it.product.id, -1)} className="grid place-items-center w-8 h-8 rounded-lg bg-line text-ink active:scale-95">
                    <Icon name="minus" size={16} strokeWidth={2.4} />
                  </button>
                  <span className="w-6 text-center text-[15px] font-bold tnum">{it.qty}</span>
                  <button onClick={() => changeQty(it.product.id, 1)} className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600 text-white active:scale-95">
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Client */}
        <button
          onClick={() => setClientSheet(true)}
          className="card w-full p-3 flex items-center gap-3 mt-3 text-left"
        >
          {client ? (
            <>
              <Avatar label={client.name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink truncate">{client.name}</p>
                <p className="text-[12px] text-muted">{client.phone || "Client identifié"}</p>
              </div>
              <span className="text-[13px] font-semibold text-brand-600">Changer</span>
            </>
          ) : (
            <>
              <span className="grid place-items-center w-11 h-11 rounded-full bg-brand-50 text-brand-500">
                <Icon name="user" size={20} />
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-ink">Associer un client</p>
                <p className="text-[12px] text-muted">Optionnel pour une vente comptant</p>
              </div>
              <Icon name="chevronR" size={18} className="text-muted" />
            </>
          )}
        </button>
      </div>

      {/* Barre de totalisation collante */}
      <div className="fixed bottom-0 inset-x-0 lg:left-60 bg-surface border-t border-line z-30" style={{ boxShadow: "0 -8px 24px -16px rgba(16,32,27,.4)" }}>
        <div className="mx-auto w-full max-w-[38rem] px-4 pt-3 pb-safe">
        <div className="pb-3">
          <div className="flex items-center justify-between text-[13px] text-muted">
            <span>Sous-total ({count} article{count > 1 ? "s" : ""})</span>
            <span className="tnum">{money(total)} FCFA</span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[15px] font-bold text-ink">Total à payer</span>
            <span className="text-[20px] font-extrabold tnum text-brand-700">{money(total)} FCFA</span>
          </div>
        </div>
        <div className="flex gap-3 pb-3">
          <button onClick={() => submit("credit")} disabled={busy || items.length === 0} className="btn-secondary flex-1">
            <Icon name="wallet" size={18} /> À crédit
          </button>
          <button onClick={() => submit("cash")} disabled={busy || items.length === 0} className="btn-primary flex-[1.4]">
            {busy ? <Spinner size={20} /> : <><Icon name="check" size={18} strokeWidth={2.4} /> Encaisser</>}
          </button>
        </div>
        </div>
      </div>

      {/* Sheet client */}
      <Sheet open={clientSheet} onClose={() => setClientSheet(false)} title="Choisir un client">
        <SearchBar value={clientSearch} onChange={setClientSearch} placeholder="Nom ou téléphone…" />
        {client && (
          <button onClick={() => { setClient(null); setClientSheet(false); }} className="w-full text-left text-[13px] font-semibold text-danger py-2.5 mt-2">
            Retirer le client
          </button>
        )}
        <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
          {filteredClients.map((c) => (
            <button
              key={c.id}
              onClick={() => { setClient(c); setClientSheet(false); setClientSearch(""); }}
              className="w-full flex items-center gap-3 p-2 rounded-xl text-left active:bg-brand-50"
            >
              <Avatar label={c.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink truncate">{c.name}</p>
                <p className="text-[12px] text-muted">{c.phone}</p>
              </div>
              {client?.id === c.id && <Icon name="check" size={18} className="text-brand-600" />}
            </button>
          ))}
          {filteredClients.length === 0 && (
            <p className="text-[13px] text-muted text-center py-6">Aucun client trouvé.</p>
          )}
        </div>
      </Sheet>
    </div>
  );
}
