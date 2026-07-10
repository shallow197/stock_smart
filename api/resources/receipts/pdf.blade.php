<style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 4px 0; }
    .total { font-weight: bold; font-size: 14px; }
    .muted { color: #666; }
</style>

<h3>Ticket N° {{ $sale->invoice_number }}</h3>
<p class="muted">{{ $sale->sold_at->format('d/m/Y H:i') }} — Client : {{ $sale->client->name ?? 'Client comptant' }}</p>

<table>
    <thead>
        <tr><th align="left">Produit</th><th>Qté</th><th>PU</th><th align="right">Total</th></tr>
    </thead>
    <tbody>
        @foreach($sale->items as $item)
        <tr>
            <td>{{ $item->product_name }}</td>
            <td align="center">{{ rtrim(rtrim($item->quantity, '0'), '.') }}</td>
            <td align="right">{{ number_format($item->unit_price, 0) }}</td>
            <td align="right">{{ number_format($item->line_total, 0) }}</td>
        </tr>
        @if($item->discount_amount > 0)
        <tr><td colspan="4" class="muted">&nbsp;&nbsp;dont remise : -{{ number_format($item->discount_amount, 0) }}</td></tr>
        @endif
        @endforeach
    </tbody>
</table>

<hr>
<p>Sous-total : {{ number_format($sale->subtotal, 0) }} FCFA</p>
@if($sale->discount_amount > 0)
<p>Remise globale : -{{ number_format($sale->discount_amount, 0) }} FCFA</p>
@endif
<p class="total">Total net : {{ number_format($sale->total, 0) }} FCFA</p>
