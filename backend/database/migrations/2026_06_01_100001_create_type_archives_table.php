<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('type_archives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('badge');
            $table->timestamps();
        });

        Schema::create('sub_type_archives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('type_archive_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_type_archives');
        Schema::dropIfExists('type_archives');
    }
};
