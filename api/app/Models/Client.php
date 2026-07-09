<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    /** Un crédit est considéré « en retard » au-delà de ce nombre de jours. */
    public const CREDIT_OVERDUE_DAYS = 30;

    protected $fillable = ['user_id', 'name', 'phone', 'address', 'is_archived'];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function creditPayments(): HasMany
    {
        return $this->hasMany(CreditPayment::class);
    }

    /** Encours de crédit = somme des restes à payer sur les ventes à crédit. */
    public function creditBalance(): float
    {
        return (float) $this->sales()
            ->where('status', 'completed')
            ->where('payment_method', 'credit')
            ->sum(\DB::raw('total - amount_paid'));
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }
}
