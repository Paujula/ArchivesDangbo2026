<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\SousSerie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RapportController extends Controller
{
    public function documentsByDate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $documents = Document::with(['user', 'serieArchive', 'sousSerie', 'service', 'direction'])
            ->whereDate('created_at', $data['date'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($doc) => [
                'id' => (string) $doc->id_document,
                'cote' => $doc->cote ?? '',
                'title' => $doc->titre,
                'description' => $doc->analyse ?? '',
                'date' => $doc->date_enregistrement?->toDateString() ?? '',
                'created_at' => $doc->created_at?->toDateTimeString() ?? '',
                'status' => $doc->statut ?? '',
                'service' => $doc->service?->name ?? '',
                'serie' => $doc->serieArchive?->nom_serie ?? '',
                'sous_serie' => $doc->sousSerie ? SousSerie::cleanLibelle($doc->sousSerie->libelle_sous_serie) : '',
                'direction' => $doc->direction?->nom_direction ?? '',
                'file' => $doc->fichier ?? '',
                'original_name' => $doc->original_name ?? '',
                'creator' => $doc->user ? [
                    'id' => (string) $doc->user->id,
                    'name' => $doc->user->name ?? '',
                    'prenom' => $doc->user->prenom ?? '',
                    'email' => $doc->user->email ?? '',
                ] : null,
                'indexed_by' => $doc->indexed_by ?? '',
            ]);

        return response()->json([
            'documents' => $documents,
            'total' => $documents->count(),
            'date' => $data['date'],
        ]);
    }
}
