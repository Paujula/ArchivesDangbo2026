<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('series_archives', function (Blueprint $table) {
            $table->dropColumn('cote');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->string('cote')->unique()->nullable()->after('titre');
        });
    }

    public function down(): void
    {
        Schema::table('series_archives', function (Blueprint $table) {
            $table->string('cote')->after('id');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('cote');
        });
    }
};
