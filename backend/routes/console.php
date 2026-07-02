<?php

use App\Models\Document;
use App\Services\PdfWatermarkService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('archives:watermark-pdfs {--dry-run : Simuler sans modifier} {--force : Forcer le watermark même si déjà présent} {--chunk=50 : Nombre de documents par lot}', function () {
    $cmd = $this;
    $dryRun = $cmd->option('dry-run');
    $force = $cmd->option('force');
    $chunkSize = (int) $cmd->option('chunk');
    $disk = Storage::disk('public');

    $total = Document::where('format', 'PDF')
        ->orWhere('original_name', 'like', '%.pdf')
        ->orWhere('fichier', 'like', '%.pdf')
        ->count();

    if ($total === 0) {
        $cmd->warn('Aucun document PDF trouvé dans la base de données.');
        return 0;
    }

    $cmd->info("{$total} document(s) PDF trouvé(s).");
    if ($dryRun) {
        $cmd->info('Mode simulation activé (--dry-run). Aucun fichier ne sera modifié.');
    }

    $processed = 0;
    $errors = 0;
    $watermarkService = app(PdfWatermarkService::class);

    $query = Document::where(function ($q) {
        $q->where('format', 'PDF')
            ->orWhere('original_name', 'like', '%.pdf')
            ->orWhere('fichier', 'like', '%.pdf');
    });

    $query->chunk($chunkSize, function ($documents) use ($disk, $watermarkService, $dryRun, $cmd, &$processed, &$errors) {
        foreach ($documents as $doc) {
            $paths = [$doc->fichier];
            if (!str_starts_with($doc->fichier, 'temp/')) {
                $paths[] = 'temp/' . $doc->fichier;
            }

            $found = false;
            foreach ($paths as $p) {
                if ($disk->exists($p)) {
                    $found = true;
                    $fullPath = $disk->path($p);

                    $cmd->line("  [{$doc->id_document}] {$doc->titre} — {$p}");

                    if (!$dryRun) {
                        try {
                            if ($watermarkService->hasWatermark($fullPath) && !$force) {
                                $cmd->warn("    ~ Déjà watermarké, ignoré (--force pour forcer)");
                            } else {
                                $watermarkService->watermark($fullPath, $fullPath, $force);
                                $cmd->info("    ✓ Filigrane ajouté");
                            }
                        } catch (\Exception $e) {
                            $cmd->error("    ✗ Erreur : {$e->getMessage()}");
                            $errors++;
                        }
                    }

                    $processed++;
                    break;
                }
            }

            if (!$found) {
                $cmd->warn("  [{$doc->id_document}] {$doc->titre} — Fichier introuvable sur le disque");
            }
        }
    });

    $cmd->newLine();
    $cmd->table(
        ['Statut', 'Valeur'],
        [
            ['Total documents', $total],
            ['Traités', $processed],
            ['Erreurs', $errors],
        ]
    );

    return 0;
})->purpose('Ajoute un filigrane "COMMUNE DE DANGBO" sur tous les PDFs existants');
