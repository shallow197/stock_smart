<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();

            $table->string('invoice_number', 25);              // INV-AAAAMMJJ-0001
            $table->enum('payment_method', ['cash', 'credit']); // Comptant ou à crédit
            $table->decimal('total', 14, 2)->default(0);
            $table->decimal('amount_paid', 14, 2)->default(0);  // Déjà payé (comptant = total, crédit ↑ via paiements)
            $table->enum('status', ['completed', 'cancelled'])->default('completed');
            $table->string('note')->nullable();
            $table->timestamp('sold_at');                       // Horodatage métier (fuseau Dakar)
            $table->timestamps();

            $table->unique(['user_id', 'invoice_number']);
            $table->index(['user_id', 'sold_at']);
            $table->index(['user_id', 'status', 'payment_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
