<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SaleController extends Controller
{
    public function __construct(private SaleService $sales) {}

    /** F-VENT-04 / F-RAP-01 — Historique filtrable par période. */
    public function index(Request $request)
    {
        $user = $request->user();
        [$start, $end] = $this->periodRange($request);

        $query = Sale::with('client')->where('user_id', $user->id);
        if ($start) {
            $query->whereBetween('sold_at', [$start, $end]);
        }
        if ($clientId = $request->integer('client_id')) {
            $query->where('client_id', $clientId);
        }

        $sales = $query->withCount('items')->latest('sold_at')->get()->map(fn ($s) => $this->serialize($s));

        // Synthèse de la période.
        $completed = collect($sales)->where('status', 'completed');
        $summary = [
            'count' => $completed->count(),
            'total' => round($completed->sum('total'), 2),
            'cash' => round($completed->where('payment_method', 'cash')->sum('total'), 2),
            'credit' => round($completed->where('payment_method', 'credit')->sum('total'), 2),
            'month_total' => round((float) Sale::where('user_id', $user->id)->where('status', 'completed')
                ->whereBetween('sold_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total'), 2),
        ];

        return response()->json(['data' => $sales, 'summary' => $summary]);
    }

    /** F-VENT-01/02/03 — Enregistrer une vente. */
    public function store(Request $request)
    {
        $data = $request->validate([
    'items' => ['required', 'array', 'min:1'],
    'items.*.product_id' => ['required', 'integer'],
    'items.*.quantity' => ['required', 'numeric', 'gt:0'],
    'items.*.unit_price' => ['nullable', 'numeric', 'gte:0'],
    'items.*.discount_type' => ['nullable', 'in:percentage,amount'],
    'items.*.discount_value' => ['nullable', 'numeric', 'gte:0'],
    'discount_type' => ['nullable', 'in:percentage,amount'],
    'discount_value' => ['nullable', 'numeric', 'gte:0'],
    'payment_method' => ['required', 'in:cash,credit'],
    'client_id' => ['nullable', 'integer',
        \Illuminate\Validation\Rule::exists('clients', 'id')->where('user_id', $request->user()->id)],
    'note' => ['nullable', 'string', 'max:191'],
]);

$sale = $this->sales->create(
    user: $request->user(),
    items: $data['items'],
    paymentMethod: $data['payment_method'],
    clientId: $data['client_id'] ?? null,
    note: $data['note'] ?? null,
    discount: isset($data['discount_type'])
        ? ['type' => $data['discount_type'], 'value' => $data['discount_value'] ?? 0]
        : null,
);

        return response()->json(['data' => $this->serialize($sale->loadCount('items'), true)], 201);
    }

    /** F-VENT-05 — Détail d'une vente. */
    public function show(Request $request, int $id)
    {
        $sale = $request->user()->sales()->with('client', 'items')->findOrFail($id);

        return response()->json(['data' => $this->serialize($sale, true)]);
    }

    /** F-VENT-06 — Annulation avec restauration du stock. */
    public function cancel(Request $request, int $id)
    {
        $sale = $request->user()->sales()->with('items')->findOrFail($id);
        $this->sales->cancel($sale);

        return response()->json(['data' => $this->serialize($sale->loadCount('items'), true)]);
    }

    private function periodRange(Request $request): array
    {
        return match ($request->string('period')->value()) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            'custom' => [
                Carbon::parse($request->string('from')->value() ?: now())->startOfDay(),
                Carbon::parse($request->string('to')->value() ?: now())->endOfDay(),
            ],
            default => [null, null],
        };
    }

    private function serialize(Sale $sale, bool $withItems = false): array
    {
        $out = [
    'id' => $sale->id,
    'invoice_number' => $sale->invoice_number,
    'client_id' => $sale->client_id,
    'client_name' => $sale->client?->name,
    'payment_method' => $sale->payment_method,
    'status' => $sale->status,
    'subtotal' => (float) $sale->subtotal,
    'discount_type' => $sale->discount_type,
    'discount_value' => (float) $sale->discount_value,
    'discount_amount' => (float) $sale->discount_amount,
    'total' => (float) $sale->total,
    'amount_paid' => (float) $sale->amount_paid,
    'outstanding' => $sale->outstanding,
    'items_count' => $sale->items_count ?? $sale->items()->count(),
    'note' => $sale->note,
    'sold_at' => $sale->sold_at->toIso8601String(),
];

        if ($withItems) {
            $out['items'] = $sale->items->map(fn ($i) => [
    'id' => $i->id,
    'product_id' => $i->product_id,
    'product_name' => $i->product_name,
    'unit_price' => (float) $i->unit_price,
    'quantity' => (float) $i->quantity,
    'discount_type' => $i->discount_type,
    'discount_value' => (float) $i->discount_value,
    'discount_amount' => (float) $i->discount_amount,
    'line_total' => (float) $i->line_total,
])->all();
        }

        return $out;
    }
}
