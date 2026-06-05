<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('ref')->unique()->nullable()->after('id_document');
            $table->foreignUuid('type_archive_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('sub_type_archive_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('format')->nullable()->after('statut');
            $table->integer('pages')->nullable()->after('format');
            $table->json('keywords')->nullable()->after('pages');
            $table->boolean('restricted')->default(false)->after('keywords');
            $table->integer('views')->default(0)->after('restricted');
            $table->string('size')->nullable()->after('views');
            $table->string('indexed_by')->nullable()->after('size');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'ref', 'type_archive_id', 'sub_type_archive_id', 'service_id',
                'format', 'pages', 'keywords', 'restricted', 'views', 'size', 'indexed_by'
            ]);
        });
    }
};
