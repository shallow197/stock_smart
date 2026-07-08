import React from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Card, Toast, Button } from "../ui/controls";

export function DashboardPage() {
  const auth = useAuth();
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState("");

  async function load() {
    setErr("");
    try {
      const res = await api.get("/api/dashboard/today", auth.token);
      setData(res);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tableau de bord</div>
          <div className="text-lg font-bold">{auth.user?.shopName || "Boutique"}</div>
        </div>
        <button className="text-sm font-semibold text-violet-700 underline" onClick={load}>
          Actualiser
        </button>
      </div>

      {err ? <Toast kind="error">{err}</Toast> : null}

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-zinc-500">CA aujourd’hui</div>
            <div className="text-xl font-bold">{data ? `${data.revenue} F` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Ventes</div>
            <div className="text-xl font-bold">{data ? data.salesCount : "—"}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-2 text-sm font-semibold">Alertes stock bas</div>
        {data?.lowStock?.length ? (
          <div className="space-y-2">
            {data.lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-zinc-600">
                  {p.quantity} / seuil {p.threshold} {p.unit}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Aucune alerte pour le moment.</div>
        )}
      </Card>

      <Card>
        <div className="mb-2 text-sm font-semibold">Activité récente</div>
        {data?.recentActivity?.length ? (
          <div className="space-y-2">
            {data.recentActivity.map((e) => (
              <div key={e.id} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{e.type}</div>
                  <div className="text-xs text-zinc-500">{new Date(e.timestamp).toLocaleString("fr-FR")}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-700">
                  {e.product?.name ? <span className="font-medium">{e.product.name}</span> : <span>—</span>}
                  {e.total ? <span className="ml-2 text-zinc-900">{e.total} F</span> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Aucune activité.</div>
        )}
      </Card>

      <Button variant="ghost" onClick={auth.logout}>
        Se déconnecter
      </Button>
    </div>
  );
}

