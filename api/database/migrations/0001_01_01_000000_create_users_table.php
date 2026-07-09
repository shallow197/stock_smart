<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // Identité du commerçant
            $table->string('name');                 // Nom complet du commerçant
            $table->string('email')->unique();
            $table->string('phone', 30)->unique();  // Connexion possible par téléphone
            $table->string('password');
            // Boutique (une boutique = un compte)
            $table->string('shop_name');
            $table->string('shop_address')->nullable();
            $table->string('logo_path')->nullable();
            // Préférences
            $table->string('currency', 8)->default('FCFA');
            $table->string('locale', 8)->default('fr');
            $table->string('timezone', 40)->default('Africa/Dakar');
            $table->string('date_format', 20)->default('d/m/Y');
            // Suivi des alertes (badge « non lues » du centre de notifications)
            $table->timestamp('alerts_seen_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
    }
};
