<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(private StockService $stock) {}

    /** F-PROD-04 / F-PROD-05 — Liste, recherche et filtres. */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Product::with('category')->where('user_id', $user->id);

        if ($request->boolean('include_archived') === false) {
            $query->where('is_archived', false);
        }

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        switch ($request->string('status')->value()) {
            case 'out':
                $query->where('stock', '<=', 0);
                break;
            case 'low':
                $query->where('alert_threshold', '>', 0)
                    ->whereColumn('stock', '<=', 'alert_threshold')
                    ->where('stock', '>', 0);
                break;
            case 'alert': // Alerte = bas OU rupture
                $query->where(function ($q) {
                    $q->where('stock', '<=', 0)
                        ->orWhere(function ($q2) {
                            $q2->where('alert_threshold', '>', 0)->whereColumn('stock', '<=', 'alert_threshold');
                        });
                });
                break;
        }

        $products = $query->orderBy('name')->get();

        // Compteurs pour les onglets.
        $base = Product::where('user_id', $user->id)->where('is_archived', false);
        $counts = [
            'all' => (clone $base)->count(),
            'alert' => (clone $base)->where(function ($q) {
                $q->where('stock', '<=', 0)->orWhere(function ($q2) {
                    $q2->where('alert_threshold', '>', 0)->whereColumn('stock', '<=', 'alert_threshold');
                });
            })->count(),
            'out' => (clone $base)->where('stock', '<=', 0)->count(),
        ];

        return response()->json(['data' => $products, 'counts' => $counts]);
    }

    /** F-PROD-01 — Ajout d'un produit. */
    public function store(Request $request)
    {
        $data = $this->validateProduct($request);
        $user = $request->user();

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('products', 'public');
        }

        $initialStock = (float) ($data['stock'] ?? 0);
        $product = $user->products()->create([
            'category_id' => $data['category_id'] ?? null,
            'name' => $data['name'],
            'purchase_price' => $data['purchase_price'] ?? 0,
            'sale_price' => $data['sale_price'],
            'stock' => 0,
            'unit' => $data['unit'] ?? null,
            'alert_threshold' => $data['alert_threshold'] ?? 0,
            'photo_path' => $photoPath,
        ]);

        if ($initialStock > 0) {
            $this->stock->move($product, 'initial', $initialStock, 'Stock initial', $product->purchase_price ?: null);
        }

        return response()->json(['data' => $product->fresh('category')], 201);
    }

    /** F-PROD-06 — Fiche produit avec historique des mouvements. */
    public function show(Request $request, int $id)
    {
        $product = $request->user()->products()->with('category')->findOrFail($id);
        $movements = $product->stockMovements()->latest('occurred_at')->limit(50)->get();

        return response()->json(['data' => $product, 'movements' => $movements]);
    }

    /** F-PROD-02 — Modification d'un produit. */
    public function update(Request $request, int $id)
    {
        $product = $request->user()->products()->findOrFail($id);
        $data = $this->validateProduct($request, true);

        if ($request->hasFile('photo')) {
            if ($product->photo_path) {
                Storage::disk('public')->delete($product->photo_path);
            }
            $product->photo_path = $request->file('photo')->store('products', 'public');
        }

        $product->fill([
            'category_id' => $data['category_id'] ?? $product->category_id,
            'name' => $data['name'] ?? $product->name,
            'purchase_price' => $data['purchase_price'] ?? $product->purchase_price,
            'sale_price' => $data['sale_price'] ?? $product->sale_price,
            'unit' => $data['unit'] ?? $product->unit,
            'alert_threshold' => $data['alert_threshold'] ?? $product->alert_threshold,
        ]);
        $product->save();

        return response()->json(['data' => $product->fresh('category')]);
    }

    /** F-PROD-03 — Archivage doux (préserve l'historique). */
    public function destroy(Request $request, int $id)
    {
        $product = $request->user()->products()->findOrFail($id);
        $product->update(['is_archived' => true]);

        return response()->json(['message' => 'Produit archivé.']);
    }

    public function restore(Request $request, int $id)
    {
        $product = $request->user()->products()->findOrFail($id);
        $product->update(['is_archived' => false]);

        return response()->json(['data' => $product]);
    }

    /** F-PROD-07 — Entrée de stock (réapprovisionnement). */
    public function stockEntry(Request $request, int $id)
    {
        $product = $request->user()->products()->findOrFail($id);
        $data = $request->validate([
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_cost' => ['nullable', 'numeric', 'gte:0'],
            'reason' => ['nullable', 'string', 'max:191'],
        ]);

        $this->stock->move(
            $product, 'entry', (float) $data['quantity'],
            $data['reason'] ?? 'Réapprovisionnement',
            isset($data['unit_cost']) ? (float) $data['unit_cost'] : null,
        );

        return response()->json(['data' => $product->fresh('category')]);
    }

    /** F-PROD-08 — Ajustement manuel après inventaire. */
    public function adjust(Request $request, int $id)
    {
        $product = $request->user()->products()->findOrFail($id);
        $data = $request->validate([
            'new_stock' => ['required', 'numeric', 'gte:0'],
            'reason' => ['nullable', 'string', 'max:191'],
        ]);

        $this->stock->adjustTo($product, (float) $data['new_stock'], $data['reason'] ?? 'Inventaire');

        return response()->json(['data' => $product->fresh('category')]);
    }

    private function validateProduct(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$req, 'string', 'max:120'],
            'category_id' => ['nullable', 'integer',
                \Illuminate\Validation\Rule::exists('categories', 'id')->where('user_id', $request->user()->id)],
            'purchase_price' => ['nullable', 'numeric', 'gte:0'],
            'sale_price' => [$req, 'numeric', 'gte:0'],
            'stock' => ['nullable', 'numeric', 'gte:0'],
            'unit' => ['nullable', 'string', 'max:30'],
            'alert_threshold' => ['nullable', 'numeric', 'gte:0'],
            'photo' => ['nullable', 'image', 'max:4096'],
        ]);
    }
}
