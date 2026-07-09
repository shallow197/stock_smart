<?php

namespace App\Services;

use App\Models\Client;
use App\Models\CreditPayment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreditService
{
    /**
     * Enregistre un remboursement de crédit et l'impute (FIFO) sur les ventes
     * à crédit les plus anciennes du client. Met à jour les restes à payer.
     */
    public function recordPayment(
        Client $client,
        float $amount,
        string $method = 'cash',
        ?string $note = null,
        ?Carbon $paidAt = null,
    ): CreditPayment {
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Le montant doit être positif.']);
        }

        $paidAt ??= now();

        return DB::transaction(function () use ($client, $amount, $method, $note, $paidAt) {
            $balance = $client->creditBalance();
            if ($amount > $balance + 0.001) {
                throw ValidationException::withMessages([
                    'amount' => "Le montant dépasse l'encours du client ({$balance} FCFA).",
                ]);
            }

            $payment = CreditPayment::create([
                'user_id' => $client->user_id,
                'client_id' => $client->id,
                'amount' => $amount,
                'method' => $method,
                'note' => $note,
                'paid_at' => $paidAt,
            ]);

            // Imputation FIFO sur les ventes à crédit non soldées.
            $remaining = $amount;
            $sales = $client->sales()
                ->where('status', 'completed')
                ->where('payment_method', 'credit')
                ->whereColumn('amount_paid', '<', 'total')
                ->orderBy('sold_at')
                ->lockForUpdate()
                ->get();

            foreach ($sales as $sale) {
                if ($remaining <= 0) {
                    break;
                }
                $due = (float) $sale->total - (float) $sale->amount_paid;
                $applied = min($due, $remaining);
                $sale->amount_paid = (float) $sale->amount_paid + $applied;
                $sale->save();
                $remaining -= $applied;
            }

            return $payment;
        });
    }
}
