<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;

class AlertService
{
    /**
     * Construit la liste des alertes actives d'un commerçant (rupture, stock bas,
     * crédits en retard). Calculées à la volée depuis l'état réel des données.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function forUser(User $user): Collection
    {
        $alerts = collect();

        // --- Alertes de stock ---
        $products = Product::where('user_id', $user->id)
            ->where('is_archived', false)
            ->where(function ($q) {
                $q->where('stock', '<=', 0)
                    ->orWhere(function ($q2) {
                        $q2->where('alert_threshold', '>', 0)
                            ->whereColumn('stock', '<=', 'alert_threshold');
                    });
            })
            ->get();

        foreach ($products as $product) {
            $isOut = (float) $product->stock <= 0;
            $alerts->push([
                'id' => 'stock-' . $product->id,
                'category' => 'stock',
                'type' => $isOut ? 'out' : 'low',
                'severity' => $isOut ? 'critical' : 'warning',
                'title' => $isOut ? 'Rupture de stock' : 'Stock bas',
                'message' => $isOut
                    ? "{$product->name} n'est plus disponible."
                    : "{$product->name} : {$this->qty($product->stock)} {$product->unit} restant (seuil : {$this->qty($product->alert_threshold)}).",
                'product_id' => $product->id,
                'client_id' => null,
                'since' => $product->updated_at?->toIso8601String(),
            ]);
        }

        // --- Alertes de crédit en retard ---
        $overdueDate = now()->subDays(Client::CREDIT_OVERDUE_DAYS);
        $clients = Client::where('user_id', $user->id)
            ->where('is_archived', false)
            ->whereHas('sales', function ($q) use ($overdueDate) {
                $q->where('status', 'completed')
                    ->where('payment_method', 'credit')
                    ->whereColumn('amount_paid', '<', 'total')
                    ->where('sold_at', '<=', $overdueDate);
            })
            ->get();

        foreach ($clients as $client) {
            $balance = $client->creditBalance();
            $oldest = $client->sales()
                ->where('status', 'completed')
                ->where('payment_method', 'credit')
                ->whereColumn('amount_paid', '<', 'total')
                ->orderBy('sold_at')
                ->value('sold_at');
            $days = $oldest ? (int) $oldest->diffInDays(now()) : Client::CREDIT_OVERDUE_DAYS;

            $alerts->push([
                'id' => 'credit-' . $client->id,
                'category' => 'credit',
                'type' => 'credit',
                'severity' => 'info',
                'title' => 'Crédit en retard',
                'message' => "{$client->name} : {$this->money($balance)} FCFA dûs depuis plus de {$days} jours.",
                'product_id' => null,
                'client_id' => $client->id,
                'since' => $oldest?->toIso8601String(),
            ]);
        }

        // Les plus critiques en premier.
        $rank = ['critical' => 0, 'warning' => 1, 'info' => 2];

        return $alerts->sortBy(fn ($a) => $rank[$a['severity']] ?? 9)->values();
    }

    public function unreadCount(User $user): int
    {
        $alerts = $this->forUser($user);
        if (! $user->alerts_seen_at) {
            return $alerts->count();
        }

        return $alerts->filter(function ($a) use ($user) {
            return $a['since'] && \Illuminate\Support\Carbon::parse($a['since'])->gt($user->alerts_seen_at);
        })->count();
    }

    private function qty($value): string
    {
        $f = (float) $value;

        return rtrim(rtrim(number_format($f, 3, '.', ''), '0'), '.');
    }

    private function money($value): string
    {
        return number_format((float) $value, 0, ',', ' ');
    }
}
