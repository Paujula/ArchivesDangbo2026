<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('historiques', function (Blueprint $table) {
            $table->text('details')->nullable()->after('action');
            $table->string('type')->nullable()->after('details');
        });
    }

    public function down(): void
    {
        Schema::table('historiques', function (Blueprint $table) {
            $table->dropColumn(['details', 'type']);
        });
    }
};
