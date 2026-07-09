import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { money } from "../lib/format";
import { FullLoader, EmptyState, Avatar, SearchBar, Segmented, Fab, ClientStatusChip } from "../components/ui";
import Header from "../components/Header";
import { Icon } from "../lib/icons";

export default function ClientsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data, loading } = useApi("/clients");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(params.get("filter") === "credit" ? "credit" : "all");

  const clients = data?.data || [];
  const counts = data?.counts || { all: 0, credit: 0 };

  const filtered = useMemo(() => {
    let list = clients;
    if (tab === "credit") list = list.filter((c) => c.credit_balance > 0).sort((a, b) => b.credit_balance - a.credit_balance);
    if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search));
    return list;
  }, [clients, tab, search]);

  return (
    <div>
      <Header title="Clients" subtitle={`${counts.all} clients · ${counts.credit} en crédit`} />

      <div className="px-4 pt-4 space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un client…" />
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "Tous", count: counts.all },
            { value: "credit", label: "En crédit", count: counts.credit },
          ]}
        />
      </div>

      {loading ? (
        <FullLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="users"
          title="Aucun client"
          hint={search || tab === "credit" ? "Aucun résultat." : "Ajoutez votre premier client."}
          action={!search && tab === "all" ? <button onClick={() => navigate("/clients/nouveau")} className="btn-primary px-5"><Icon name="plus" size={18} /> Ajouter un client</button> : null}
        />
      ) : (
        <ul className="px-4 lg:px-6 mt-1 space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 pb-4">
          {filtered.map((c) => (
            <li key={c.id}>
              <button onClick={() => navigate(`/clients/${c.id}`)} className="card w-full p-3 flex items-center gap-3 text-left active:scale-[0.99] transition">
                <Avatar label={c.name} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink truncate">{c.name}</p>
                  <p className="text-[12px] text-muted truncate">{c.phone || "—"} · {c.purchases_count} achat{c.purchases_count > 1 ? "s" : ""}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.credit_balance > 0 ? (
                    <span className={`text-[14px] font-bold tnum ${c.status === "late" ? "text-danger" : "text-warn"}`}>{money(c.credit_balance)} F</span>
                  ) : (
                    <span className="text-[13px] font-medium text-muted tnum">{money(c.total_spent)} F</span>
                  )}
                  <ClientStatusChip status={c.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={() => navigate("/clients/nouveau")} label="Ajouter un client" />
    </div>
  );
}
