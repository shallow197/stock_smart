<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReceiptController extends Controller
{
    /** Téléchargement PDF (utilisateur connecté). */
    public function pdf(Request $request, int $id)
    {
        $sale = $request->user()->sales()->with('client', 'items')->findOrFail($id);

        return $this->buildPdf($sale)->download("ticket-{$sale->invoice_number}.pdf");
    }

    /** Génère (ou renvoie) le lien de partage public. */
    public function share(Request $request, int $id)
    {
        $sale = $request->user()->sales()->findOrFail($id);

        if (! $sale->share_token) {
            $sale->share_token = Str::random(40);
            $sale->save();
        }

        return response()->json([
            'url' => rtrim(config('app.frontend_url', config('app.url')), '/') . "/receipt/{$sale->share_token}",
        ]);
    }

    /** Consultation publique (sans authentification), via le lien partagé. */
    public function publicShow(string $token)
    {
        $sale = Sale::where('share_token', $token)->with('client', 'items')->firstOrFail();

        return response()->json(['data' => $this->serializePublic($sale)]);
    }

    /** PDF public, via le lien partagé. */
    public function publicPdf(string $token)
    {
        $sale = Sale::where('share_token', $token)->with('client', 'items')->firstOrFail();

        return $this->buildPdf($sale)->stream("ticket-{$sale->invoice_number}.pdf");
    }

    private function buildPdf(Sale $sale)
    {
        return Pdf::loadView('receipts.pdf', ['sale' => $sale])->setPaper('a5', 'portrait');
    }

    private function serializePublic(Sale $sale): array
    {
        return [
            'invoice_number' => $sale->invoice_number,
            'client_name' => $sale->client?->name,
            'subtotal' => (float) $sale->subtotal,
            'discount_amount' => (float) $sale->discount_amount,
            'total' => (float) $sale->total,
            'sold_at' => $sale->sold_at->toIso8601String(),
            'items' => $sale->items->map(fn ($i) => [
                'product_name' => $i->product_name,
                'unit_price' => (float) $i->unit_price,
                'quantity' => (float) $i->quantity,
                'discount_amount' => (float) $i->discount_amount,
                'line_total' => (float) $i->line_total,
            ])->all(),
        ];
    }
}
