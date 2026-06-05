<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demandes', function (Blueprint $table) {
            $table->foreignId('traite_par')->nullable()->constrained('users', 'id')->nullOnDelete()->after('id_utilisateur');
        });
    }

    public function down(): void
    {
        Schema::table('demandes', function (Blueprint $table) {
            $table->dropForeign(['traite_par']);
            $table->dropColumn('traite_par');
        });
    }
};
