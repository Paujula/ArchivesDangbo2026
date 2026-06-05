<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('demandes', function (Blueprint $table) {
            $table->id('id_demande');
            $table->dateTime('date_demande');
            $table->text('objet');
            $table->string('statut_demande')->default('en_attente');
            $table->foreignId('id_document')->constrained('documents', 'id_document')->cascadeOnDelete();
            $table->foreignId('id_utilisateur')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};
