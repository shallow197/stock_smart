<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name');
            $table->decimal('purchase_price', 12, 2)->default(0); // Prix d'achat (marge, dernier prix saisi)
            $table->decimal('sale_price', 12, 2)->default(0);     // Prix de vente
            $table->decimal('stock', 14, 3)->default(0);          // Quantité en stock
            $table->string('unit', 30)->nullable();               // Unité (sac, bidon, unité, boîte…)
            $table->decimal('alert_threshold', 14, 3)->default(0); // Seuil d'alerte stock bas
            $table->string('photo_path')->nullable();
            $table->boolean('is_archived')->default(false);        // Archivage doux (préserve l'historique)
            $table->timestamps();

            $table->index(['user_id', 'is_archived']);
            $table->index(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
