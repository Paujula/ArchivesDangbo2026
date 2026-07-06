<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Direction;
use App\Models\Document;
use App\Models\SerieArchive;
use App\Models\Service;
use App\Models\SousSerie;
use App\Services\PdfWatermarkService;
use App\Traits\Auditable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArchivesController extends Controller
{
    use Auditable;
    public function upload(Request $request): JsonResponse
    {
        $data = $request->validate(['file' => 'required|file|max:102400']);

        $file = $request->file('file');
        $path = $file->store('temp', 'public');

        $pages = $this->countPages($file->getRealPath(), $file->getClientOriginalExtension());

        return response()->json([
            'temp_id' => basename($path),
            'ext' => $file->getClientOriginalExtension(),
            'original_name' => $file->getClientOriginalName(),
            'size_mb' => round($file->getSize() / 1048576, 2),
            'mime_type' => $file->getMimeType(),
            'pages' => $pages,
        ]);
    }

    private function countPages(string $path, string $ext): int
    {
        $ext = strtolower($ext);

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'bmp', 'gif', 'webp'])) {
            return 1;
        }

        if ($ext === 'pdf') {
            $content = @file_get_contents($path, false, null, 0, 1024 * 512);
            if ($content === false) return 0;

            if (preg_match('/\/Type\s*\/Pages[^}]*\/Count\s+(\d+)/s', $content, $m)) {
                return (int) $m[1];
            }

            $count = preg_match_all('/\/Type\s*\/Page\b[^s]/s', $content);
            return $count ?: 1;
        }

        return 0;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Document::with(['serieArchive', 'sousSerie', 'service', 'direction', 'user']);

        if ($q = $request->get('q')) {
            $query->where(function ($qry) use ($q) {
                $qry->where('titre', 'like', "%{$q}%")
                    ->orWhere('cote', 'like', "%{$q}%")
                    ->orWhere('analyse', 'like', "%{$q}%")
                    ->orWhere('emplacement', 'like', "%{$q}%")
                    ->orWhere('indexed_by', 'like', "%{$q}%")
                    ->orWhereHas('serieArchive', fn ($s) => $s->where('nom_serie', 'like', "%{$q}%"))
                    ->orWhereHas('sousSerie', fn ($s) => $s->where('libelle_sous_serie', 'like', "%{$q}%"))
                    ->orWhereHas('direction', fn ($s) => $s->where('nom_direction', 'like', "%{$q}%"))
                    ->orWhereHas('service', fn ($s) => $s->where('name', 'like', "%{$q}%"))
                    ->orWhereRaw('DATE_FORMAT(date_enregistrement, \'%Y-%m-%d\') like ?', ["%{$q}%"])
                    ->orWhereRaw('DATE_FORMAT(date_enregistrement, \'%d/%m/%Y\') like ?', ["%{$q}%"])
                    ->orWhereRaw('DATE_FORMAT(date_enregistrement, \'%e/%c/%Y\') like ?', ["%{$q}%"]);
            });
        }

        if ($types = $request->get('types')) {
            $serieIds = \App\Models\SerieArchive::whereIn('nom_serie', $types)->pluck('id');
            if ($serieIds->isNotEmpty()) {
                $query->whereIn('id_serie', $serieIds);
            }
        }

        if ($statuses = $request->get('statuses')) {
            $query->whereIn('statut', $statuses);
        }

        if ($service = $request->get('service')) {
            $serviceModel = \App\Models\Service::where('name', $service)->first();
            if ($serviceModel) {
                $query->where('service_id', $serviceModel->id);
            }
        }

        if ($direction = $request->get('direction')) {
            $directionModel = \App\Models\Direction::where('nom_direction', $direction)->first();
            if ($directionModel) {
                $query->where('direction_id', $directionModel->id);
            }
        }

        if ($from = $request->get('from')) {
            $query->whereDate('date_enregistrement', '>=', $from);
        }

        if ($to = $request->get('to')) {
            $query->whereDate('date_enregistrement', '<=', $to);
        }

        if ($format = $request->get('format')) {
            $query->where('format', $format);
        }

        if ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $lastViewCol = \Illuminate\Support\Facades\DB::table('historiques')
            ->selectRaw('MAX(date_action)')
            ->whereColumn('id_document', 'documents.id_document')
            ->where('action', 'like', 'Consultation%');

        switch ($request->get('sort')) {
            case 'recent':
                // Documents consultés récemment (avec vue), triés par dernière consultation
                $query->where('views', '>', 0);
                $query->orderByDesc($lastViewCol)->orderBy('id_document', 'desc');
                break;
            case 'ancien':
            case 'oldest':
                // Documents consultés il y a longtemps
                $query->where('views', '>', 0);
                $query->orderBy($lastViewCol)->orderBy('id_document', 'asc');
                break;
            case 'titre':
            case 'title':
                $query->orderBy('titre', 'asc')->orderBy('id_document', 'asc');
                break;
            case 'vues':
                // Documents les plus consultés
                $query->orderBy('views', 'desc')->orderBy('id_document', 'desc');
                break;
            default:
                // Tri par défaut : date d'enregistrement (pas de filtre vue)
                $query->orderBy('date_enregistrement', 'desc')->orderBy('id_document', 'desc');
                break;
        }

        $documents = $query->paginate($perPage);

        return response()->json([
            'archives' => $documents->map(fn ($d) => $this->formatDoc($d)),
            'total' => $documents->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cote' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'service' => 'nullable|string',
            'direction' => 'nullable|string',
            'serie' => 'nullable|string',
            'sous_serie' => 'nullable|string',
            'emplacement' => 'nullable|string',
            'status' => 'nullable|string',
            'format' => 'nullable|string',
            'date' => 'nullable|date',
            'pages' => 'nullable|integer',
            'restricted' => 'nullable|boolean',
            'keywords' => 'nullable|array',
            'description' => 'nullable|string',
            'temp_id' => 'nullable|string',
            'original_name' => 'nullable|string|max:255',
            'draft' => 'nullable|boolean',
        ]);

        $document = new Document();
        $document->cote = $data['cote'] ?? null;
        $document->titre = $data['title'];
        $document->analyse = $data['description'] ?? null;
        $document->date_enregistrement = $data['date'] ?? now();
        $document->statut = $data['draft'] ? 'brouillon' : 'approuvé';
        $document->emplacement = isset($data['emplacement']) ? preg_replace('/\s+/', ' ', trim($data['emplacement'])) : null;
        $document->format = $data['format'] ?? null;
        $document->pages = $data['pages'] ?? null;
        $document->keywords = $data['keywords'] ?? [];
        $document->restricted = filter_var($data['restricted'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $document->service_id = $this->resolveServiceId($data['service'] ?? null);
        $document->direction_id = $this->resolveDirectionId($data['direction'] ?? null);
        $document->id_serie = $this->resolveSerieId($data['serie'] ?? null);
        $document->id_sous_serie = $this->resolveSousSerieId($data['sous_serie'] ?? null);
        $document->user_id = $request->user()->id;
        $document->fichier = $data['temp_id'] ? 'temp/' . $data['temp_id'] : null;
        $document->original_name = $data['original_name'] ?? null;
        $document->indexed_by = $request->user()->name;
        $document->save();

        $skipWatermark = $document->serieArchive && str_starts_with($document->serieArchive->nom_serie, 'État-civil');

        if (!$skipWatermark && $document->fichier && $document->original_name && strtolower(pathinfo($document->original_name, PATHINFO_EXTENSION)) === 'pdf') {
            $fullPath = Storage::disk('public')->path($document->fichier);
            if (file_exists($fullPath)) {
                try {
                    $svc = app(PdfWatermarkService::class);
                    if (!$svc->hasWatermark($fullPath)) {
                        $svc->watermark($fullPath, $fullPath);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Watermark échoué à l\'upload: ' . $e->getMessage());
                }
            }
        }

        $this->logAction('Création du document', 'document', "Titre: {$document->titre} | Cote: {$document->cote} | Analyse: {$document->analyse} | Fichier: {$document->original_name} | Pages: {$document->pages} | Format: {$document->format} | Service: {$document->service_id}", $document->id_document);

        $document->load(['service', 'direction', 'serieArchive', 'sousSerie', 'user']);

        return response()->json([
            'archive' => $this->formatDoc($document),
            'message' => 'Document créé avec succès.',
        ], 201);
    }

    public function show(Document $document): JsonResponse
    {
        $document->load(['service', 'direction', 'serieArchive', 'sousSerie', 'user', 'historiques.utilisateur']);

        return response()->json(['archive' => $this->formatDoc($document)]);
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'cote' => 'nullable|string|max:255',
            'service' => 'nullable|string',
            'direction' => 'nullable|string',
            'serie' => 'nullable|string',
            'sous_serie' => 'nullable|string',
            'emplacement' => 'nullable|string|max:255',
            'status' => 'nullable|string',
            'format' => 'nullable|string',
            'date' => 'nullable|date',
            'pages' => 'nullable|integer',
            'restricted' => 'nullable|boolean',
            'keywords' => 'nullable|array',
            'description' => 'nullable|string',
            'temp_id' => 'nullable|string',
            'original_name' => 'nullable|string|max:255',
            'draft' => 'nullable|boolean',
        ]);

        $original = $document->getOriginal();

        if (array_key_exists('draft', $data)) {
            $document->statut = $data['draft'] ? 'brouillon' : 'approuvé';
        }

        if (!empty($data['temp_id'])) {
            $tempPath = 'temp/' . $data['temp_id'];
            if (Storage::disk('public')->exists($tempPath)) {
                if ($document->fichier && Storage::disk('public')->exists($document->fichier)) {
                    Storage::disk('public')->delete($document->fichier);
                }
                $document->fichier = $tempPath;
                $document->original_name = $data['original_name'] ?? $document->original_name;
            }
        }

        $document->titre = $data['title'] ?? $document->titre;
        $document->cote = $data['cote'] ?? $document->cote;
        $document->analyse = $data['description'] ?? $document->analyse;
        $document->emplacement = isset($data['emplacement']) ? preg_replace('/\s+/', ' ', trim($data['emplacement'])) : $document->emplacement;
        $document->format = $data['format'] ?? $document->format;
        $document->pages = $data['pages'] ?? $document->pages;
        $document->keywords = $data['keywords'] ?? $document->keywords;
        $document->restricted = $data['restricted'] ?? $document->restricted;
        $document->date_enregistrement = $data['date'] ? new \Carbon\Carbon($data['date']) : $document->date_enregistrement;
        $document->service_id = $this->resolveServiceId($data['service'] ?? null) ?? $document->service_id;
        $document->direction_id = $this->resolveDirectionId($data['direction'] ?? null) ?? $document->direction_id;
        $document->id_serie = $this->resolveSerieId($data['serie'] ?? null) ?? $document->id_serie;
        $document->id_sous_serie = $this->resolveSousSerieId($data['sous_serie'] ?? null) ?? $document->id_sous_serie;
        $document->save();

        if (!empty($data['temp_id'])) {
            $skipWatermark = $document->serieArchive && str_starts_with($document->serieArchive->nom_serie, 'État-civil');

            if (!$skipWatermark && $document->fichier && $document->original_name && strtolower(pathinfo($document->original_name, PATHINFO_EXTENSION)) === 'pdf') {
                $fullPath = Storage::disk('public')->path($document->fichier);
                if (file_exists($fullPath)) {
                    try {
                        $svc = app(PdfWatermarkService::class);
                        if (!$svc->hasWatermark($fullPath)) {
                            $svc->watermark($fullPath, $fullPath);
                        }
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning('Watermark échoué à la modification: ' . $e->getMessage());
                    }
                }
            }
        }

        $changes = [];
        if (!empty($data['temp_id'])) {
            $changes[] = 'Fichier: remplacé';
        }
        $fieldLabels = [
            'titre' => 'Titre', 'cote' => 'Cote', 'analyse' => 'Analyse',
            'statut' => 'Statut', 'emplacement' => 'Emplacement',
            'format' => 'Format', 'pages' => 'Pages',
        ];
        foreach ($fieldLabels as $field => $label) {
            $oldVal = $original[$field] ?? '';
            $newVal = $document->$field ?? '';
            if ((string) $oldVal !== (string) $newVal) {
                $changes[] = "{$label}: {$oldVal} → {$newVal}";
            }
        }
        $fkLabels = ['service_id' => 'Service', 'direction_id' => 'Direction', 'id_serie' => 'Série', 'id_sous_serie' => 'Sous-série'];
        foreach ($fkLabels as $field => $label) {
            $oldVal = $original[$field] ?? '';
            $newVal = $document->$field ?? '';
            if ((string) $oldVal !== (string) $newVal) {
                $changes[] = "{$label}: modifié";
            }
        }
        $oldRestricted = !empty($original['restricted']);
        $newRestricted = !empty($document->restricted);
        if ($oldRestricted !== $newRestricted) {
            $changes[] = 'Restreint: ' . ($oldRestricted ? 'Oui' : 'Non') . ' → ' . ($newRestricted ? 'Oui' : 'Non');
        }

        $details = "Cote: {$document->cote} | Titre: {$document->titre}" . ($changes ? ' | ' . implode(' | ', $changes) : '');

        $this->logAction('Modification du document', 'document', $details, $document->id_document);

        $document->load(['service', 'direction', 'serieArchive', 'sousSerie', 'user']);

        return response()->json([
            'archive' => $this->formatDoc($document),
            'message' => 'Document modifié avec succès.',
        ]);
    }

    public function destroy(Document $document): JsonResponse
    {
        $this->logAction('Suppression du document', 'document', "Cote: {$document->cote} | Titre: {$document->titre} | Analyse: {$document->analyse} | Fichier: {$document->original_name}", $document->id_document);

        if ($document->fichier) {
            Storage::disk('public')->delete($document->fichier);
        }

        $document->delete();

        return response()->json(['message' => 'Document supprimé avec succès.']);
    }

    public function recordView(Request $request, Document $document): JsonResponse
    {
        $document->increment('views');

        $this->logAction('Consultation du document', 'document', "Titre: {$document->titre} | Cote: {$document->cote} | Analyse: {$document->analyse} | Pages: {$document->pages} | Format: {$document->format}", $document->id_document);

        return response()->json(['views' => $document->views]);
    }

    public function related(Document $document): JsonResponse
    {
        $related = Document::where('service_id', $document->service_id)
            ->where('id_document', '!=', $document->id_document)
            ->limit(5)
            ->get();

        return response()->json([
            'archives' => $related->map(fn ($d) => $this->formatDoc($d)),
        ]);
    }

    public function download(Document $document, Request $request)
    {
        if (!$document->fichier) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        $user = $request->user();
        $isSave = $request->boolean('save', false);

        if ($isSave && !in_array($user->role, ['admin', 'chef'])) {
            $hasAccess = \App\Models\Demande::where('id_utilisateur', $user->id)
                ->where('id_document', $document->id_document)
                ->where('type', 'telechargement')
                ->where('statut_demande', 'approuve')
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Vous n\'avez pas l\'autorisation de télécharger ce document. Veuillez faire une demande d\'accès.'], 403);
            }
        }

        $paths = [$document->fichier];
        if (!str_starts_with($document->fichier, 'temp/')) {
            $paths[] = 'temp/' . $document->fichier;
        }

        $disk = Storage::disk('public');
        foreach ($paths as $p) {
            if ($disk->exists($p)) {
                if ($isSave) {
                    $this->logAction('Téléchargement du document', 'document', "Titre: {$document->titre} | Cote: {$document->cote} | Analyse: {$document->analyse} | Fichier: {$document->original_name}", $document->id_document);
                }

                return $isSave
                    ? $disk->download($p, $document->original_name)
                    : $disk->response($p);
            }
        }

        return response()->json(['message' => 'Fichier introuvable.'], 404);
    }

    private function resolveDirectionId(?string $value): ?string
    {
        if (!$value) return null;
        $dir = Direction::find($value) ?? Direction::where('nom_direction', $value)->first();
        return $dir?->id;
    }

    private function resolveSerieId(?string $value): ?string
    {
        if (!$value) return null;
        $serie = SerieArchive::find($value) ?? SerieArchive::where('nom_serie', $value)->first();
        return $serie?->id;
    }

    private function resolveSousSerieId(?string $value): ?string
    {
        if (!$value) return null;
        $ss = SousSerie::find($value) ?? SousSerie::where('libelle_sous_serie', $value)->first();
        return $ss?->id;
    }

    private function resolveServiceId(?string $value): ?string
    {
        if (!$value) return null;
        $service = Service::find($value) ?? Service::where('name', $value)->first();
        return $service?->id;
    }

    private function formatDoc(Document $doc): array
    {
        return [
            'id' => (string) $doc->id_document,
            'cote' => $doc->cote ?? '',
            'title' => $doc->titre,
            'date' => $doc->date_enregistrement?->toDateString() ?? '',
            'created_at' => $doc->created_at?->toDateTimeString() ?? '',
            'status' => $doc->statut ?? 'Courante',
            'service' => $doc->service?->name ?? $doc->service_id ?? '',
            'direction' => $doc->direction?->nom_direction ?? '',
            'serie' => $doc->serieArchive?->nom_serie ?? '',
            'sous_serie' => $doc->sousSerie ? \App\Models\SousSerie::cleanLibelle($doc->sousSerie->libelle_sous_serie) : '',
            'emplacement' => $doc->emplacement ?? '',
            'format' => $doc->format ?? 'Numérique',
            'pages' => $doc->pages ?? 0,
            'size' => $doc->size ?? '—',
            'views' => $doc->views ?? 0,
            'indexed_by' => $doc->indexed_by ?? ($doc->user?->name ?? ''),
            'keywords' => $doc->keywords ?? [],
            'kw' => $doc->keywords ?? [],
            'restricted' => $doc->restricted ?? false,
            'file' => $doc->fichier ?? '',
            'original_name' => $doc->original_name ?? '',
            'description' => $doc->analyse ?? '',
            'by' => $doc->indexed_by ?? ($doc->user?->name ?? ''),
            'log' => $doc->relationLoaded('historiques')
                ? $doc->historiques->map(fn($h) => [
                    'user' => $h->utilisateur?->name ?? 'Inconnu',
                    'action' => $h->action,
                    'when' => $h->date_action ? (new \Carbon\Carbon($h->date_action))->toIso8601String() : '',
                ])->values()->all()
                : [],
        ];
    }
}
