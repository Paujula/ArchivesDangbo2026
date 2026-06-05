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
        Schema::create('documents', function (Blueprint $table) {
            $table->id('id_document');
            $table->string('titre');
            $table->text('analyse')->nullable();
            $table->date('date_enregistrement')->nullable();
            $table->string('statut')->default('non confidentiel');
            $table->string('emplacement')->nullable();
            $table->string('fichier')->nullable();
            $table->foreignId('id_serie')->constrained('series_archives')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
