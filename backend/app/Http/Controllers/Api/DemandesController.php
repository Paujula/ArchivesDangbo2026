<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Demande;
use App\Models\Document;
use App\Traits\Auditable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandesController extends Controller
{
    use Auditable;

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_document' => 'required|exists:documents,id_document',
        ]);

        $user = $request->user();
        $document = Document::findOrFail($data['id_document']);

        $exists = Demande::where('id_utilisateur', $user->id)
            ->where('id_document', $document->id_document)
            ->where('type', 'telechargement')
            ->whereIn('statut_demande', ['en_attente', 'approuve'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Vous avez déjà une demande en cours pour ce document.'], 409);
        }

        $demande = Demande::create([
            'date_demande' => now(),
            'objet' => "Téléchargement du document « {$document->titre} »",
            'type' => 'telechargement',
            'statut_demande' => 'en_attente',
            'id_document' => $document->id_document,
            'id_utilisateur' => $user->id,
        ]);

        $this->logAction(
            "Demande de téléchargement",
            'demande',
            "Document: {$document->titre} | Cote: {$document->cote} | Demandeur: {$user->prenom} {$user->name}",
            $document->id_document
        );

        return response()->json([
            'demande' => $this->format($demande->load('utilisateur', 'document', 'traitePar')),
            'message' => 'Demande de téléchargement envoyée. En attente de validation.',
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Demande::with('utilisateur', 'document', 'traitePar')
            ->where('type', 'telechargement')
            ->orderBy('date_demande', 'desc');

        if (in_array($user->role, ['agent', 'archiviste'])) {
            $query->where('id_utilisateur', $user->id);
        }

        $perPage = min((int) ($request->get('per_page', 20)), 100);
        $demandes = $query->paginate($perPage);

        return response()->json([
            'demandes' => collect($demandes->items())->map(fn ($d) => $this->format($d)),
            'total' => $demandes->total(),
            'per_page' => $demandes->perPage(),
            'current_page' => $demandes->currentPage(),
            'last_page' => $demandes->lastPage(),
        ]);
    }

    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_document' => 'required|exists:documents,id_document',
        ]);

        $user = $request->user();

        if (in_array($user->role, ['admin', 'chef'])) {
            return response()->json([
                'can_download' => true,
                'statut' => 'autorise',
            ]);
        }

        $demande = Demande::where('id_utilisateur', $user->id)
            ->where('id_document', $data['id_document'])
            ->where('type', 'telechargement')
            ->latest('date_demande')
            ->first();

        if (!$demande) {
            return response()->json(['can_download' => false, 'statut' => null]);
        }

        return response()->json([
            'can_download' => $demande->statut_demande === 'approuve',
            'statut' => $demande->statut_demande,
            'demande_id' => $demande->id_demande,
        ]);
    }

    public function approve(Demande $demande): JsonResponse
    {
        if ($demande->type !== 'telechargement') {
            return response()->json(['message' => 'Type de demande invalide.'], 400);
        }

        $demande->update(['statut_demande' => 'approuve', 'traite_par' => request()->user()->id]);

        $this->logAction(
            "Approbation de téléchargement",
            'demande',
            "Document: {$demande->document->titre} | Cote: {$demande->document->cote} | Demandeur: {$demande->utilisateur->prenom} {$demande->utilisateur->name}",
            $demande->id_document
        );

        return response()->json([
            'demande' => $this->format($demande->fresh()->load('utilisateur', 'document', 'traitePar')),
            'message' => 'Demande approuvée. L\'utilisateur peut maintenant télécharger le document.',
        ]);
    }

    public function reject(Demande $demande): JsonResponse
    {
        if ($demande->type !== 'telechargement') {
            return response()->json(['message' => 'Type de demande invalide.'], 400);
        }

        $demande->update(['statut_demande' => 'refuse', 'traite_par' => request()->user()->id]);

        $this->logAction(
            "Refus de téléchargement",
            'demande',
            "Document: {$demande->document->titre} | Cote: {$demande->document->cote} | Demandeur: {$demande->utilisateur->prenom} {$demande->utilisateur->name}",
            $demande->id_document
        );

        return response()->json([
            'demande' => $this->format($demande->fresh()->load('utilisateur', 'document', 'traitePar')),
            'message' => 'Demande refusée.',
        ]);
    }

    private function format($d): array
    {
        return [
            'id' => $d->id_demande,
            'objet' => $d->objet,
            'type' => $d->type,
            'statut' => $d->statut_demande,
            'date_demande' => $d->date_demande ? (new \Carbon\Carbon($d->date_demande))->toIso8601String() : '',
            'document' => $d->document ? [
                'id' => (string) $d->document->id_document,
                'title' => $d->document->titre ?? '',
                'cote' => $d->document->cote ?? '',
                'keywords' => $d->document->keywords ?? [],
                'description' => $d->document->analyse ?? '',
                'original_name' => $d->document->original_name ?? '',
                'file' => $d->document->fichier ?? '',
            ] : null,
            'utilisateur' => $d->utilisateur ? [
                'id' => (string) $d->utilisateur->id,
                'name' => $d->utilisateur->name ?? '',
                'prenom' => $d->utilisateur->prenom ?? '',
            ] : null,
            'traite_par' => $d->traitePar ? [
                'id' => (string) $d->traitePar->id,
                'name' => $d->traitePar->name ?? '',
                'prenom' => $d->traitePar->prenom ?? '',
            ] : null,
        ];
    }
}
