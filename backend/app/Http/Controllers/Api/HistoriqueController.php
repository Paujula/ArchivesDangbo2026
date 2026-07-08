<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoriqueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Historique::with('utilisateur', 'document')
            ->orderBy('date_action', 'desc');

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($userId = $request->get('user_id')) {
            $query->where('id_utilisateur', $userId);
        }

        if ($q = $request->get('q')) {
            $query->where(function ($qry) use ($q) {
                $qry->where('action', 'like', "%{$q}%")
                    ->orWhere('details', 'like', "%{$q}%");
            });
        }

        $perPage = min((int) ($request->get('per_page', 50)), 100);
        $historiques = $query->paginate($perPage);

        return response()->json([
            'historiques' => $historiques->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'type' => $h->type ?? 'document',
                'details' => $h->details ?? '',
                'date_action' => $h->date_action ? (new \Carbon\Carbon($h->date_action))->toIso8601String() : '',
                'user' => $h->utilisateur ? [
                    'id' => (string) $h->utilisateur->id,
                    'name' => $h->utilisateur->name ?? '',
                    'prenom' => $h->utilisateur->prenom ?? '',
                    'initials' => $h->utilisateur->initials ?? '',
                    'color' => $h->utilisateur->color ?? '#0c6e4a',
                    'carte' => $h->utilisateur->carte ? \Illuminate\Support\Facades\Storage::disk('public')->url($h->utilisateur->carte) : '',
                ] : null,
                'document' => $h->document ? [
                    'id' => (string) $h->document->id_document,
                    'title' => $h->document->titre ?? '',
                    'cote' => $h->document->cote ?? '',
                    'original_name' => $h->document->original_name ?? '',
                ] : null,
            ])->values()->all(),
            'total' => $historiques->total(),
            'per_page' => $historiques->perPage(),
            'current_page' => $historiques->currentPage(),
            'last_page' => $historiques->lastPage(),
        ]);
    }

    public function deletedItems(Request $request): JsonResponse
    {
        $perPage = min((int) ($request->get('per_page', 50)), 100);

        $query = Historique::with('utilisateur')
            ->where(function ($q) {
                $q->where('action', 'like', 'Suppression du document%')
                  ->orWhere('action', 'like', 'Suppression de l\'utilisateur%');
            })
            ->orderBy('date_action', 'desc');

        $items = $query->paginate($perPage);

        return response()->json([
            'items' => $items->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'type' => $h->type ?? 'document',
                'details' => $h->details ?? '',
                'date_action' => $h->date_action ? (new \Carbon\Carbon($h->date_action))->toIso8601String() : '',
                'user' => $h->utilisateur ? [
                    'id' => (string) $h->utilisateur->id,
                    'name' => $h->utilisateur->name ?? '',
                    'prenom' => $h->utilisateur->prenom ?? '',
                ] : null,
            ])->values()->all(),
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    public function stats(): JsonResponse
    {
        $totalDocs = \App\Models\Document::count();
        $weekStart = now()->startOfWeek();

        $docsThisWeek = \App\Models\Document::where('created_at', '>=', $weekStart)->count();

        return response()->json([
            'total_documents' => $totalDocs,
            'documents_this_week' => $docsThisWeek,
            'total_users' => \App\Models\User::count(),
            'active_users' => \App\Models\User::whereNotNull('email_verified_at')->count(),
            'total_views' => \App\Models\Document::sum('views'),
            'recent_activity' => Historique::with('utilisateur')
                ->orderBy('date_action', 'desc')
                ->take(10)
                ->get()
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'action' => $h->action,
                    'type' => $h->type ?? '',
                    'details' => $h->details ?? '',
                    'date_action' => $h->date_action ? (new \Carbon\Carbon($h->date_action))->toIso8601String() : '',
                    'user' => $h->utilisateur ? [
                        'name' => $h->utilisateur->prenom ? trim($h->utilisateur->prenom . ' ' . $h->utilisateur->name) : $h->utilisateur->name,
                        'initials' => $h->utilisateur->initials ?? '',
                        'color' => $h->utilisateur->color ?? '#0c6e4a',
                    ] : null,
                ])->values()->all(),
            'series_distribution' => \App\Models\SerieArchive::withCount('documents')
                ->get()
                ->map(fn ($s) => ['label' => $s->nom_serie, 'count' => $s->documents_count])
                ->values()->all(),
            'service_distribution' => \App\Models\Service::withCount('documents')
                ->get()
                ->map(fn ($s) => ['label' => $s->name, 'count' => $s->documents_count])
                ->values()->all(),
            'direction_distribution' => \App\Models\Direction::withCount('documents')
                ->get()
                ->map(fn ($s) => ['label' => $s->nom_direction, 'count' => $s->documents_count])
                ->values()->all(),
        ]);
    }
}
