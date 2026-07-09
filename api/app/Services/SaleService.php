<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(
        private InvoiceService $invoices,
        private StockService $stock,
    ) {}

    /**
     * Enregistre une vente : instantané des lignes, déduction du stock,
     * numéro de facture, mode de paiement comptant/crédit. Tout est atomique.
     *
     * @param array<int, array{product_id:int, quantity:float, unit_price?:float}> $items
     */
    public function create(
        User $user,
        array $items,
        string $paymentMethod,
        ?int $clientId = null,
        ?string $note = null,
        ?Carbon $soldAt = null,
    ): Sale {
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'Le panier est vide.']);
        }
        if ($paymentMethod === 'credit' && ! $clientId) {
            throw ValidationException::withMessages(['client_id' => 'Une vente à crédit doit être associée à un client.']);
        }

        $soldAt ??= now();

        return DB::transaction(function () use ($user, $items, $paymentMethod, $clientId, $note, $soldAt) {
            // Charge et verrouille les produits concernés.
            $ids = array_map(fn ($i) => (int) $i['product_id'], $items);
            $products = Product::where('user_id', $user->id)
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $total = 0.0;
            $lines = [];
            foreach ($items as $item) {
                $product = $products->get((int) $item['product_id']);
                if (! $product) {
                    throw ValidationException::withMessages(['items' => 'Produit introuvable.']);
                }
                $qty = (float) $item['quantity'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages(['items' => "Quantité invalide pour « {$product->name} »."]);
                }
                if ($qty > (float) $product->stock) {
                    throw ValidationException::withMessages([
                        'items' => "Stock insuffisant pour « {$product->name} » (disponible : {$product->stock}).",
                    ]);
                }
                $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : (float) $product->sale_price;
                $lineTotal = round($unitPrice * $qty, 2);
                $total += $lineTotal;
                $lines[] = compact('product', 'qty', 'unitPrice', 'lineTotal');
            }

            $total = round($total, 2);

            $sale = Sale::create([
                'user_id' => $user->id,
                'client_id' => $clientId,
                'invoice_number' => $this->invoices->nextNumber($user->id, $soldAt),
                'payment_method' => $paymentMethod,
                'total' => $total,
                'amount_paid' => $paymentMethod === 'cash' ? $total : 0,
                'status' => 'completed',
                'note' => $note,
                'sold_at' => $soldAt,
            ]);

            foreach ($lines as $line) {
                $sale->items()->create([
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'unit_price' => $line['unitPrice'],
                    'quantity' => $line['qty'],
                    'line_total' => $line['lineTotal'],
                ]);

                // Déduction réelle du stock + trace du mouvement.
                $this->stock->move(
                    product: $line['product'],
                    type: 'sale',
                    quantity: -$line['qty'],
                    sourceType: Sale::class,
                    sourceId: $sale->id,
                    occurredAt: $soldAt,
                );
            }

            return $sale->load('items', 'client');
        });
    }

    /** Annule une vente : restaure le stock de chaque ligne. */
    public function cancel(Sale $sale): Sale
    {
        if ($sale->status === 'cancelled') {
            return $sale;
        }

        return DB::transaction(function () use ($sale) {
            $sale->load('items.product');
            foreach ($sale->items as $item) {
                if ($item->product) {
                    $this->stock->move(
                        product: $item->product,
                        type: 'cancellation',
                        quantity: (float) $item->quantity,
                        reason: "Annulation vente {$sale->invoice_number}",
                        sourceType: Sale::class,
                        sourceId: $sale->id,
                    );
                }
            }

            $sale->status = 'cancelled';
            $sale->save();

            return $sale;
        });
    }
}
