<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id', 'client_id', 'invoice_number', 'payment_method',
    'total', 'subtotal', 'discount_type', 'discount_value', 'discount_amount',
    'amount_paid', 'status', 'note', 'sold_at', 'share_token',
];
        

    protected $casts = [
    'total' => 'decimal:2',
    'subtotal' => 'decimal:2',
    'discount_value' => 'decimal:2',
    'discount_amount' => 'decimal:2',
    'amount_paid' => 'decimal:2',
    'sold_at' => 'datetime',
];

    protected $appends = ['outstanding'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /** Reste à payer (ventes à crédit). */
    public function getOutstandingAttribute(): float
    {
        return max(0, (float) $this->total - (float) $this->amount_paid);
    }
}
