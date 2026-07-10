<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // F-VENT-08 : remise globale
            $table->decimal('subtotal', 14, 2)->default(0)->after('total'); // somme des lignes avant remise globale
            $table->enum('discount_type', ['percentage', 'amount'])->nullable()->after('subtotal');
            $table->decimal('discount_value', 14, 2)->default(0)->after('discount_type');
            $table->decimal('discount_amount', 14, 2)->default(0)->after('discount_value');

            // F-VENT-07 : lien de partage du ticket
            $table->string('share_token', 64)->nullable()->unique()->after('note');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            // F-VENT-08 : remise par ligne
            $table->enum('discount_type', ['percentage', 'amount'])->nullable()->after('line_total');
            $table->decimal('discount_value', 12, 2)->default(0)->after('discount_type');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('discount_value');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'discount_type', 'discount_value', 'discount_amount', 'share_token']);
        });
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount_value', 'discount_amount']);
        });
    }
};
