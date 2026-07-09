<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\CreditService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(private CreditService $credits) {}

    /** F-CLI-03 / F-CLI-06 — Liste, recherche, filtre « en crédit ». */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Client::where('user_id', $user->id)->where('is_archived', false)
            ->withCount(['sales' => fn ($q) => $q->where('status', 'completed')]);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderBy('name')->get()->map(fn ($c) => $this->serialize($c));

        $filter = $request->string('filter')->value();
        if ($filter === 'credit') {
            $clients = $clients->filter(fn ($c) => $c['credit_balance'] > 0)->values();
        }

        // Tri : encours décroissant d'abord pour l'onglet crédit.
        if ($filter === 'credit') {
            $clients = $clients->sortByDesc('credit_balance')->values();
        }

        $creditCount = Client::where('user_id', $user->id)->where('is_archived', false)
            ->whereHas('sales', function ($q) {
                $q->where('status', 'completed')->where('payment_method', 'credit')
                    ->whereColumn('amount_paid', '<', 'total');
            })->count();

        return response()->json([
            'data' => $clients,
            'counts' => ['all' => Client::where('user_id', $user->id)->where('is_archived', false)->count(), 'credit' => $creditCount],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:191'],
        ]);

        $client = $request->user()->clients()->create($data);

        return response()->json(['data' => $this->serialize($client->loadCount('sales'))], 201);
    }

    /** F-CLI-04 — Fiche client : coordonnées, encours, historique. */
    public function show(Request $request, int $id)
    {
        $client = $request->user()->clients()->withCount(['sales' => fn ($q) => $q->where('status', 'completed')])->findOrFail($id);

        return response()->json([
            'data' => $this->serialize($client),
            'history' => $this->history($client),
        ]);
    }

    public function update(Request $request, int $id)
    {
        $client = $request->user()->clients()->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:191'],
        ]);
        $client->update($data);

        return response()->json(['data' => $this->serialize($client->loadCount('sales'))]);
    }

    public function destroy(Request $request, int $id)
    {
        $client = $request->user()->clients()->findOrFail($id);
        $client->update(['is_archived' => true]);

        return response()->json(['message' => 'Client archivé.']);
    }

    /** F-CLI-05 — Enregistrer un paiement (remboursement de crédit). */
    public function recordPayment(Request $request, int $id)
    {
        $client = $request->user()->clients()->findOrFail($id);
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['nullable', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:191'],
        ]);

        $this->credits->recordPayment(
            $client, (float) $data['amount'], $data['method'] ?? 'cash', $data['note'] ?? null,
        );

        $client->loadCount(['sales' => fn ($q) => $q->where('status', 'completed')]);

        return response()->json([
            'data' => $this->serialize($client),
            'history' => $this->history($client),
        ]);
    }

    /** Sérialise un client avec ses indicateurs de crédit. */
    private function serialize(Client $client): array
    {
        $balance = $client->creditBalance();
        $totalSpent = (float) $client->sales()->where('status', 'completed')->sum('total');

        $overdue = $client->sales()
            ->where('status', 'completed')->where('payment_method', 'credit')
            ->whereColumn('amount_paid', '<', 'total')
            ->where('sold_at', '<=', now()->subDays(Client::CREDIT_OVERDUE_DAYS))
            ->exists();

        $status = 'ok';
        if ($balance > 0) {
            $status = $overdue ? 'late' : 'credit';
        }

        return [
            'id' => $client->id,
            'name' => $client->name,
            'phone' => $client->phone,
            'address' => $client->address,
            'purchases_count' => $client->sales_count ?? $client->sales()->where('status', 'completed')->count(),
            'credit_balance' => round($balance, 2),
            'total_spent' => round($totalSpent, 2),
            'status' => $status,
            'created_at' => $client->created_at?->toIso8601String(),
        ];
    }

    /** Historique récent : ventes et paiements, montants signés. */
    private function history(Client $client): array
    {
        $items = [];

        foreach ($client->sales()->latest('sold_at')->limit(30)->get() as $sale) {
            $items[] = [
                'kind' => $sale->payment_method === 'credit' ? 'credit_sale' : 'cash_sale',
                'sale_id' => $sale->id,
                'title' => $sale->payment_method === 'credit' ? 'Vente à crédit' : 'Vente comptant',
                'subtitle' => $sale->invoice_number,
                'amount' => (float) $sale->total,
                'sign' => $sale->payment_method === 'credit' ? 1 : 0,
                'badge' => $sale->status === 'cancelled' ? 'Annulée' : ($sale->payment_method === 'credit' ? 'Crédit' : 'Comptant'),
                'at' => $sale->sold_at->toIso8601String(),
            ];
        }

        foreach ($client->creditPayments()->latest('paid_at')->limit(30)->get() as $p) {
            $items[] = [
                'kind' => 'payment',
                'sale_id' => null,
                'title' => 'Paiement reçu',
                'subtitle' => ucfirst($p->method),
                'amount' => (float) $p->amount,
                'sign' => -1,
                'badge' => 'Payé',
                'at' => $p->paid_at->toIso8601String(),
            ];
        }

        usort($items, fn ($a, $b) => strcmp($b['at'], $a['at']));

        return $items;
    }
}
