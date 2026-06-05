<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sous_series', function (Blueprint $table) {
            $table->foreignId('id_serie')->nullable()->constrained('series_archives')->cascadeOnDelete();
        });

        Schema::table('series_archives', function (Blueprint $table) {
            $table->dropConstrainedForeignId('id_sous_serie');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('id_sous_serie')->nullable()->constrained('sous_series')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('id_sous_serie');
        });

        Schema::table('series_archives', function (Blueprint $table) {
            $table->foreignId('id_sous_serie')->nullable()->constrained('sous_series')->cascadeOnDelete();
        });

        Schema::table('sous_series', function (Blueprint $table) {
            $table->dropConstrainedForeignId('id_serie');
        });
    }
};
