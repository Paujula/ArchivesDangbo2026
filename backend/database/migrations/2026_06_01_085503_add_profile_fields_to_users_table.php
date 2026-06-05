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
        Schema::table('users', function (Blueprint $table) {
            $table->string('prenom')->nullable()->after('name');
            $table->string('telephone')->nullable()->after('email');
            $table->string('adresse')->nullable()->after('telephone');
            $table->string('service')->nullable()->after('adresse');
            $table->string('direction')->nullable()->after('service');
            $table->string('statut_matrimoniale')->nullable()->after('direction');
            $table->string('role')->default('agent')->after('statut_matrimoniale');
            $table->string('carte')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['prenom', 'telephone', 'adresse', 'service', 'direction', 'statut_matrimoniale', 'role', 'carte']);
        });
    }
};
