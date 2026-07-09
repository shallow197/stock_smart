<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'category_id', 'name', 'purchase_price', 'sale_price',
        'stock', 'unit', 'alert_threshold', 'photo_path', 'is_archived',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'stock' => 'decimal:3',
        'alert_threshold' => 'decimal:3',
        'is_archived' => 'boolean',
    ];

    protected $appends = ['stock_status', 'photo_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /** normal | low | out — codage couleur des statuts. */
    public function getStockStatusAttribute(): string
    {
        if ((float) $this->stock <= 0) {
            return 'out';
        }
        if ((float) $this->alert_threshold > 0 && (float) $this->stock <= (float) $this->alert_threshold) {
            return 'low';
        }
        return 'normal';
    }

    public function getPhotoUrlAttribute(): ?string
    {
        // Chemin relatif : sert le proxy Vite en dev et la même origine en prod.
        return $this->photo_path ? '/storage/' . $this->photo_path : null;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }
}
