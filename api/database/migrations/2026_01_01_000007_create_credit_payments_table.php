<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();

            $table->decimal('amount', 14, 2);        // Montant remboursé (total ou partiel)
            $table->string('method', 20)->default('cash');
            $table->string('note')->nullable();
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index(['user_id', 'paid_at']);
            $table->index(['client_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_payments');
    }
};
