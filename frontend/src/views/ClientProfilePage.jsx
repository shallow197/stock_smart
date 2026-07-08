import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Card, Toast } from "../ui/controls";

export function ClientProfilePage() {
  const { id } = useParams();
  const auth = useAuth();
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState("");

  async function load() {
    setErr("");
    try {
      const res = await api.get(`/api/clients/${id}?page=1&pageSize=50`, auth.token);
      setData(res);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">Profil client</div>
      {err ? <Toast kind="error">{err}</Toast> : null}

      <Card>
        <div className="text-sm font-bold">{data?.client?.name || "—"}</div>
        <div className="text-sm text-zinc-700">{data?.client?.phone || "—"}</div>
        {data?.client?.email ? <div className="text-xs text-zinc-500">{data.client.email}</div> : null}
        {data?.client?.address ? <div className="mt-1 text-xs text-zinc-500">{data.client.address}</div> : null}
      </Card>

      <Card>
        <div className="mb-2 text-sm font-semibold">Historique d’achats</div>
        {data?.history?.length ? (
          <div className="space-y-2">
            {data.history.map((e) => (
              <div key={e.id} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{e.type}</div>
                  <div className="text-xs text-zinc-500">{new Date(e.timestamp).toLocaleString("fr-FR")}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-700">
                  {e.product?.name ? <span className="font-medium">{e.product.name}</span> : <span>—</span>}
                  {e.total ? <span className="ml-2 text-zinc-900">{e.total} F</span> : null}
                </div>
                {e.invoiceNumber ? <div className="text-xs text-zinc-500">{e.invoiceNumber}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Aucun achat enregistré.</div>
        )}
      </Card>
    </div>
  );
}

