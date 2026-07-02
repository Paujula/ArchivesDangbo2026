<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Direction;
use App\Models\SerieArchive;
use App\Models\Service;
use App\Models\SousSerie;
use App\Traits\Auditable;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    use Auditable;
    public function listDirections(): JsonResponse
    {
        return response()->json([
            'directions' => Direction::all(['id', 'nom_direction']),
        ]);
    }

    public function createDirection(Request $request): JsonResponse
    {
        $data = $request->validate(['nom_direction' => 'required|string|max:255']);
        $direction = Direction::create($data);

        $this->logAction('Création de la direction', 'settings', "Nom: {$direction->nom_direction}");

        return response()->json([
            'direction' => ['id' => $direction->id, 'nom_direction' => $direction->nom_direction],
            'message' => 'Direction créée avec succès.',
        ], 201);
    }

    public function updateDirection(Request $request, Direction $direction): JsonResponse
    {
        $data = $request->validate(['nom_direction' => 'required|string|max:255']);
        $direction->update($data);

        $this->logAction('Modification de la direction', 'settings', "Nouveau nom: {$direction->nom_direction}");

        return response()->json([
            'direction' => ['id' => $direction->id, 'nom_direction' => $direction->nom_direction],
            'message' => 'Direction modifiée avec succès.',
        ]);
    }

    public function deleteDirection(Direction $direction): JsonResponse
    {
        try {
            $direction->delete();
            $this->logAction('Suppression de la direction', 'settings', "Nom: {$direction->nom_direction}");
            return response()->json(['message' => 'Direction supprimée avec succès.']);
        } catch (QueryException) {
            return response()->json(['message' => 'Impossible de supprimer : des documents sont liés à cette direction.'], 409);
        }
    }

    public function listSeries(): JsonResponse
    {
        $series = SerieArchive::with('sousSeries:id,libelle_sous_serie,id_serie')->get();

        return response()->json([
            'series' => $series->map(fn ($s) => [
                'id' => $s->id,
                'nom_serie' => $s->nom_serie,
                'sous_series' => $s->sousSeries->map(fn ($ss) => [
                    'id' => $ss->id,
                    'libelle_sous_serie' => $ss->libelle_sous_serie,
                ]),
            ]),
        ]);
    }

    public function listSousSeries(): JsonResponse
    {
        return response()->json([
            'sous_series' => SousSerie::with('serie:id,nom_serie')->get(['id', 'libelle_sous_serie', 'id_serie']),
        ]);
    }

    public function listServices(): JsonResponse
    {
        return response()->json([
            'services' => Service::with('direction:id,nom_direction')->get(['id', 'name', 'direction_id']),
        ]);
    }

    public function createService(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'direction_id' => 'required|exists:directions,id',
        ]);
        $service = Service::create($data);
        $service->load('direction:id,nom_direction');

        $this->logAction('Création du service', 'settings', "Nom: {$service->name} | Direction ID: {$service->direction_id}");

        return response()->json([
            'service' => ['id' => $service->id, 'name' => $service->name, 'direction_id' => $service->direction_id],
            'message' => 'Service créé avec succès.',
        ], 201);
    }

    public function updateService(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'direction_id' => 'required|exists:directions,id',
        ]);
        $service->update($data);
        $service->load('direction:id,nom_direction');

        $this->logAction('Modification du service', 'settings', "Nouveau nom: {$service->name} | Direction ID: {$service->direction_id}");

        return response()->json([
            'service' => ['id' => $service->id, 'name' => $service->name, 'direction_id' => $service->direction_id],
            'message' => 'Service modifié avec succès.',
        ]);
    }

    public function deleteService(Service $service): JsonResponse
    {
        try {
            $service->delete();
            $this->logAction('Suppression du service', 'settings', "Nom: {$service->name} | Direction ID: {$service->direction_id}");
            return response()->json(['message' => 'Service supprimé avec succès.']);
        } catch (QueryException) {
            return response()->json(['message' => 'Impossible de supprimer : des documents sont liés à ce service.'], 409);
        }
    }

    public function createSousSerie(Request $request): JsonResponse
    {
        $data = $request->validate([
            'libelle_sous_serie' => 'required|string|max:255',
            'id_serie' => 'required|exists:series_archives,id',
        ]);
        $sousSerie = SousSerie::create($data);
        $sousSerie->load('serie:id,nom_serie');

        $this->logAction('Création de la sous-série', 'settings', "Libellé: {$sousSerie->libelle_sous_serie} | Série ID: {$sousSerie->id_serie}");

        return response()->json([
            'sous_serie' => [
                'id' => $sousSerie->id,
                'libelle_sous_serie' => $sousSerie->libelle_sous_serie,
                'id_serie' => $sousSerie->id_serie,
            ],
            'message' => 'Sous-série créée avec succès.',
        ], 201);
    }

    public function updateSousSerie(Request $request, SousSerie $sousSerie): JsonResponse
    {
        $data = $request->validate([
            'libelle_sous_serie' => 'required|string|max:255',
            'id_serie' => 'required|exists:series_archives,id',
        ]);
        $sousSerie->update($data);

        $this->logAction('Modification de la sous-série', 'settings', "Nouveau libellé: {$sousSerie->libelle_sous_serie} | Série ID: {$sousSerie->id_serie}");

        return response()->json([
            'sous_serie' => [
                'id' => $sousSerie->id,
                'libelle_sous_serie' => $sousSerie->libelle_sous_serie,
                'id_serie' => $sousSerie->id_serie,
            ],
            'message' => 'Sous-série modifiée avec succès.',
        ]);
    }

    public function deleteSousSerie(SousSerie $sousSerie): JsonResponse
    {
        try {
            $sousSerie->delete();
            $this->logAction('Suppression de la sous-série', 'settings', "Libellé: {$sousSerie->libelle_sous_serie} | Série ID: {$sousSerie->id_serie}");
            return response()->json(['message' => 'Sous-série supprimée avec succès.']);
        } catch (QueryException) {
            return response()->json(['message' => 'Impossible de supprimer : des documents sont liés à cette sous-série.'], 409);
        }
    }

    public function createSerie(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom_serie' => 'required|string|max:255',
        ]);
        $serie = SerieArchive::create($data);

        $this->logAction('Création de la série', 'settings', "Nom: {$serie->nom_serie}");

        return response()->json([
            'serie' => [
                'id' => $serie->id,
                'nom_serie' => $serie->nom_serie,
                'sous_series' => [],
            ],
            'message' => 'Série créée avec succès.',
        ], 201);
    }

    public function updateSerie(Request $request, SerieArchive $serieArchive): JsonResponse
    {
        $data = $request->validate([
            'nom_serie' => 'required|string|max:255',
        ]);
        $serieArchive->update($data);

        $this->logAction('Modification de la série', 'settings', "Nouveau nom: {$serieArchive->nom_serie}");

        return response()->json([
            'serie' => [
                'id' => $serieArchive->id,
                'nom_serie' => $serieArchive->nom_serie,
            ],
            'message' => 'Série modifiée avec succès.',
        ]);
    }

    public function deleteSerie(SerieArchive $serieArchive): JsonResponse
    {
        try {
            $serieArchive->delete();
            $this->logAction('Suppression de la série', 'settings', "Nom: {$serieArchive->nom_serie}");
            return response()->json(['message' => 'Série supprimée avec succès.']);
        } catch (QueryException) {
            return response()->json(['message' => 'Impossible de supprimer : des sous-séries ou documents sont liés à cette série.'], 409);
        }
    }

}
