import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import { Card, Toast } from "../ui/controls";

export function LogByDatePage() {
  const { dateKey } = useParams();
  const auth = useAuth();
  const [log, setLog] = React.useState(null);
  const [summary, setSummary] = React.useState(null);
  const [err, setErr] = React.useState("");

  async function load() {
    setErr("");
    try {
      const [l, s] = await Promise.all([
        api.get(`/api/logs/${dateKey}`, auth.token),
        api.get(`/api/logs/${dateKey}/summary`, auth.token),
      ]);
      setLog(l.log);
      setSummary(s.summary);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">Journal {dateKey}</div>
      {err ? <Toast kind="error">{err}</Toast> : null}

      <Card>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-zinc-500">Ouverture</div>
            <div className="font-semibold">{summary ? `${summary.openingStockValue} F` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Fermeture</div>
            <div className="font-semibold">{summary ? `${summary.closingStockValue} F` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Ventes</div>
            <div className="font-semibold">{summary ? `${summary.totalSales} F` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Arrivages</div>
            <div className="font-semibold">{summary ? `${summary.totalArrivals} F` : "—"}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-2 text-sm font-semibold">Entrées</div>
        {log?.entries?.length ? (
          <div className="space-y-2">
            {log.entries.map((e) => (
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
                {e.note ? <div className="mt-1 text-xs text-zinc-600">{e.note}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Aucune entrée.</div>
        )}
      </Card>
    </div>
  );
}

