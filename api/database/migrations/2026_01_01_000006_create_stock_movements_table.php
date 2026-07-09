<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // initial = stock de création, entry = réappro, sale = vente,
            // adjustment = inventaire, cancellation = annulation de vente
            $table->enum('type', ['initial', 'entry', 'sale', 'adjustment', 'cancellation']);
            $table->decimal('quantity', 14, 3);       // Signé : + entrée, - sortie
            $table->decimal('stock_after', 14, 3);    // Stock résultant (traçabilité)
            $table->decimal('unit_cost', 12, 2)->nullable(); // Prix d'achat pour une entrée
            $table->string('reason')->nullable();     // Motif (ajustement, fournisseur…)

            // Lien polymorphe léger vers la source (ex : une vente)
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();

            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['user_id', 'occurred_at']);
            $table->index(['product_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
