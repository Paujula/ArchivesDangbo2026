<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('initials')->nullable()->after('prenom');
            $table->string('color')->nullable()->after('initials');
            $table->json('rights')->nullable()->after('color');
            $table->timestamp('last_login_at')->nullable()->after('remember_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['initials', 'color', 'rights', 'last_login_at']);
        });
    }
};
