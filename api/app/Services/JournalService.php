<?php

namespace App\Services;

use App\Models\CreditPayment;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Carbon;

class JournalService
{
    /**
     * Journal d'activité horodaté d'une journée (F-RAP-01), reconstruit à partir
     * des ventes, mouvements de stock et paiements — pas de log parallèle.
     *
     * @return array<int, array<string, mixed>>
     */
    public function forDate(User $user, Carbon $date): array
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();
        $activities = [];

        $sales = Sale::with('client')
            ->where('user_id', $user->id)
            ->whereBetween('sold_at', [$start, $end])
            ->get();
        foreach ($sales as $sale) {
            $cancelled = $sale->status === 'cancelled';
            $activities[] = [
                'kind' => $cancelled ? 'cancellation' : 'sale',
                'icon' => $cancelled ? 'x' : ($sale->payment_method === 'credit' ? 'credit' : 'sale'),
                'title' => $cancelled
                    ? "Vente annulée · {$sale->invoice_number}"
                    : ($sale->payment_method === 'credit' ? 'Vente à crédit' : 'Vente comptant'),
                'description' => trim(($sale->client?->name ?? 'Client comptant') . ' · ' . $sale->invoice_number),
                'amount' => (float) $sale->total,
                'sign' => $cancelled ? 0 : 1,
                'muted' => $cancelled,
                'at' => $sale->sold_at->toIso8601String(),
                'link' => ['type' => 'sale', 'id' => $sale->id],
            ];
        }

        $movements = StockMovement::with('product')
            ->where('user_id', $user->id)
            ->whereIn('type', ['entry', 'adjustment'])
            ->whereBetween('occurred_at', [$start, $end])
            ->get();
        foreach ($movements as $m) {
            $isEntry = $m->type === 'entry';
            $activities[] = [
                'kind' => $m->type,
                'icon' => $isEntry ? 'in' : 'adjust',
                'title' => $isEntry ? 'Entrée de stock' : 'Ajustement de stock',
                'description' => ($m->product?->name ?? 'Produit') . ' · ' . $this->signedQty($m->quantity),
                'amount' => null,
                'sign' => 0,
                'muted' => false,
                'at' => $m->occurred_at->toIso8601String(),
                'link' => $m->product_id ? ['type' => 'product', 'id' => $m->product_id] : null,
            ];
        }

        $payments = CreditPayment::with('client')
            ->where('user_id', $user->id)
            ->whereBetween('paid_at', [$start, $end])
            ->get();
        foreach ($payments as $p) {
            $activities[] = [
                'kind' => 'payment',
                'icon' => 'payment',
                'title' => 'Paiement reçu',
                'description' => ($p->client?->name ?? 'Client') . ' · ' . ucfirst($p->method),
                'amount' => (float) $p->amount,
                'sign' => 1,
                'muted' => false,
                'at' => $p->paid_at->toIso8601String(),
                'link' => $p->client_id ? ['type' => 'client', 'id' => $p->client_id] : null,
            ];
        }

        usort($activities, fn ($a, $b) => strcmp($b['at'], $a['at']));

        return $activities;
    }

    /** Rapport de synthèse du jour (F-RAP-02). */
    public function dailyReport(User $user, Carbon $date): array
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        $sales = Sale::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$start, $end])
            ->get();

        $itemsSold = (float) \App\Models\SaleItem::whereIn('sale_id', $sales->pluck('id'))->sum('quantity');
        $cashReceived = (float) $sales->where('payment_method', 'cash')->sum('total');
        $creditGiven = (float) $sales->where('payment_method', 'credit')->sum('total');
        $paymentsReceived = (float) CreditPayment::where('user_id', $user->id)
            ->whereBetween('paid_at', [$start, $end])->sum('amount');

        return [
            'date' => $date->toDateString(),
            'sales_count' => $sales->count(),
            'total_sales' => (float) $sales->sum('total'),
            'cash_received' => $cashReceived,
            'credit_given' => $creditGiven,
            'payments_received' => $paymentsReceived,
            'items_sold' => $itemsSold,
        ];
    }

    private function signedQty($value): string
    {
        $f = (float) $value;
        $s = rtrim(rtrim(number_format(abs($f), 3, '.', ''), '0'), '.');

        return ($f >= 0 ? '+' : '−') . $s;
    }
}
