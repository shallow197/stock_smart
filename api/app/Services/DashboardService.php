<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(private AlertService $alerts) {}

    public function overview(User $user): array
    {
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        $yesterdayStart = now()->subDay()->startOfDay();
        $yesterdayEnd = now()->subDay()->endOfDay();

        $todaySales = (float) Sale::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$todayStart, $todayEnd])
            ->sum('total');

        $yesterdaySales = (float) Sale::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$yesterdayStart, $yesterdayEnd])
            ->sum('total');

        $todayCount = Sale::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$todayStart, $todayEnd])
            ->count();

        // Valeur du stock au prix d'achat.
        $stockValue = (float) Product::where('user_id', $user->id)
            ->where('is_archived', false)
            ->sum(DB::raw('stock * purchase_price'));

        $productsCount = Product::where('user_id', $user->id)->where('is_archived', false)->count();

        // Encours crédits (tous clients).
        $creditOutstanding = (float) Sale::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('payment_method', 'credit')
            ->sum(DB::raw('total - amount_paid'));

        $creditClients = Client::where('user_id', $user->id)
            ->whereHas('sales', function ($q) {
                $q->where('status', 'completed')
                    ->where('payment_method', 'credit')
                    ->whereColumn('amount_paid', '<', 'total');
            })->count();

        $change = $yesterdaySales > 0
            ? round((($todaySales - $yesterdaySales) / $yesterdaySales) * 100)
            : null;

        return [
            'today_sales' => $todaySales,
            'today_sales_count' => $todayCount,
            'today_change_pct' => $change,
            'stock_value' => $stockValue,
            'products_count' => $productsCount,
            'credit_outstanding' => $creditOutstanding,
            'credit_clients_count' => $creditClients,
            'alerts_count' => $this->alerts->forUser($user)->count(),
            'sales_7days' => $this->salesLast7Days($user),
            'top_products' => $this->topProducts($user),
        ];
    }

    /** Ventes agrégées sur les 7 derniers jours (pour l'histogramme). */
    private function salesLast7Days(User $user): array
    {
        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i);
            $total = (float) Sale::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('sold_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                ->sum('total');
            $days[] = [
                'date' => $day->toDateString(),
                'label' => mb_strtoupper(mb_substr($day->locale('fr')->dayName, 0, 1)),
                'total' => $total,
            ];
        }

        return $days;
    }

    /** Top 5 des produits les plus vendus sur 30 jours. */
    private function topProducts(User $user): array
    {
        $since = now()->subDays(30)->startOfDay();

        return SaleItem::query()
            ->select('product_id', 'product_name', DB::raw('SUM(quantity) as qty_sold'), DB::raw('SUM(line_total) as revenue'))
            ->whereHas('sale', function ($q) use ($user, $since) {
                $q->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->where('sold_at', '>=', $since);
            })
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('qty_sold')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->product_name,
                'qty_sold' => (float) $row->qty_sold,
                'revenue' => (float) $row->revenue,
            ])->all();
    }
}
