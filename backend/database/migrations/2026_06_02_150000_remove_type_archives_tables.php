<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['type_archive_id']);
            $table->dropForeign(['sub_type_archive_id']);
            $table->dropColumn(['type_archive_id', 'sub_type_archive_id']);
        });

        Schema::dropIfExists('sub_type_archives');
        Schema::dropIfExists('type_archives');
    }

    public function down(): void
    {
        Schema::create('type_archives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('badge');
            $table->timestamps();
        });

        Schema::create('sub_type_archives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('type_archive_id')->constrained('type_archives')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignUuid('type_archive_id')->nullable()->constrained('type_archives')->nullOnDelete();
            $table->foreignUuid('sub_type_archive_id')->nullable()->constrained('sub_type_archives')->nullOnDelete();
        });
    }
};
