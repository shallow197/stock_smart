<?php

namespace App\Services;

use App\Models\Sale;
use Illuminate\Support\Carbon;

class InvoiceService
{
    /**
     * Génère le prochain numéro de facture pour un commerçant : INV-AAAAMMJJ-0001.
     * Séquence remise à zéro chaque jour, par boutique. À appeler dans une transaction.
     */
    public function nextNumber(int $userId, Carbon $date): string
    {
        $datePart = $date->format('Ymd');
        $prefix = "INV-{$datePart}-";

        $last = Sale::where('user_id', $userId)
            ->where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('invoice_number')
            ->lockForUpdate()
            ->value('invoice_number');

        $next = 1;
        if ($last) {
            $seq = (int) substr($last, strrpos($last, '-') + 1);
            $next = $seq + 1;
        }

        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
