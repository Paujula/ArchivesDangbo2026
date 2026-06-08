<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('direction_id')->nullable()->constrained('directions')->nullOnDelete();
        });

        DB::table('services')->where('name', 'SIS')->update(['direction_id' => 4]);
        DB::table('services')->where('name', 'SAE')->update(['direction_id' => 4]);
        DB::table('services')->where('name', 'SAGS')->update(['direction_id' => 4]);
        DB::table('services')->where('name', 'SDPSS')->update(['direction_id' => 5]);
        DB::table('services')->where('name', 'SCASCS')->update(['direction_id' => 5]);
        DB::table('services')->where('name', 'SEST')->update(['direction_id' => 6]);
        DB::table('services')->where('name', 'SVEMI')->update(['direction_id' => 6]);
        DB::table('services')->where('name', 'SRHAG')->update(['direction_id' => 7]);
        DB::table('services')->where('name', 'SBFC')->update(['direction_id' => 7]);
        DB::table('services')->where('name', 'SRR')->update(['direction_id' => 7]);
        DB::table('services')->where('name', 'ETAT CIVIL')->update(['direction_id' => 7]);
        DB::table('services')->where('name', 'SADU')->update(['direction_id' => 8]);
        DB::table('services')->where('name', 'SPE')->update(['direction_id' => 8]);
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['direction_id']);
            $table->dropColumn('direction_id');
        });
    }
};
