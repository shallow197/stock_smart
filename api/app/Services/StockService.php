<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Carbon;

class StockService
{
    /**
     * Applique un mouvement de stock et journalise la trace.
     * $quantity est signé : positif pour une entrée, négatif pour une sortie.
     * Le produit est mis à jour dans la foulée — source de vérité unique.
     */
    public function move(
        Product $product,
        string $type,
        float $quantity,
        ?string $reason = null,
        ?float $unitCost = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?Carbon $occurredAt = null,
    ): StockMovement {
        $newStock = (float) $product->stock + $quantity;
        $product->stock = $newStock;
        if ($unitCost !== null && $quantity > 0) {
            // Marge calculée sur le dernier prix d'achat saisi (hypothèse MVP).
            $product->purchase_price = $unitCost;
        }
        $product->save();

        return StockMovement::create([
            'user_id' => $product->user_id,
            'product_id' => $product->id,
            'type' => $type,
            'quantity' => $quantity,
            'stock_after' => $newStock,
            'unit_cost' => $unitCost,
            'reason' => $reason,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'occurred_at' => $occurredAt ?? now(),
        ]);
    }

    /** Ajuste le stock à une valeur cible absolue (inventaire physique). */
    public function adjustTo(Product $product, float $targetStock, ?string $reason = null): StockMovement
    {
        $delta = $targetStock - (float) $product->stock;

        return $this->move($product, 'adjustment', $delta, $reason);
    }
}
