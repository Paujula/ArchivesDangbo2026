<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\SousSerie;
use App\Models\SerieArchive;
use App\Models\Historique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = Document::with('serieArchive.sousSerie', 'user');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('analyse', 'like', "%{$search}%")
                  ->orWhere('statut', 'like', "%{$search}%")
                  ->orWhere('emplacement', 'like', "%{$search}%")
                  ->orWhereHas('serieArchive', function ($sq) use ($search) {
                      $sq->where('nom_serie', 'like', "%{$search}%")
                         ->orWhere('cote', 'like', "%{$search}%")
                         ->orWhereHas('sousSerie', function ($ssq) use ($search) {
                             $ssq->where('libelle_sous_serie', 'like', "%{$search}%");
                         });
                  });
            });
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(12);

        if ($request->ajax()) {
            return response()->json(['documents' => $documents]);
        }

        return view('documents.index', compact('documents'));
    }

    public function create()
    {
        return view('documents.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'cote' => 'required|string|max:255',
            'titre' => 'required|string|max:255',
            'analyse' => 'nullable|string',
            'date_enregistrement' => 'required|date',
            'nom_serie' => 'required|string|max:255',
            'libelle_sous_serie' => 'required|string|max:255',
            'statut' => 'required|in:confidentiel,non confidentiel',
            'emplacement' => 'required|string|max:255',
            'fichier' => 'required|file|max:204800',
        ]);

        $fichier = $request->file('fichier');
        $fichierName = time() . '_' . $fichier->getClientOriginalName();
        $fichier->move(public_path('uploads'), $fichierName);

        $serieArchive = SerieArchive::firstOrCreate(['nom_serie' => $request->nom_serie]);
        $sousSerie = SousSerie::firstOrCreate([
            'libelle_sous_serie' => $request->libelle_sous_serie,
            'id_serie' => $serieArchive->id,
        ]);

        $document = Document::create([
            'titre' => $request->titre,
            'analyse' => $request->analyse,
            'cote' => $request->cote,
            'date_enregistrement' => $request->date_enregistrement,
            'statut' => $request->statut,
            'emplacement' => $request->emplacement,
            'fichier' => $fichierName,
            'id_serie' => $serieArchive->id,
            'id_sous_serie' => $sousSerie->id,
            'user_id' => auth()->id(),
        ]);

        Historique::create([
            'action' => 'Ajout document : ' . $request->titre,
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
            'id_document' => $document->id_document,
        ]);

        return redirect()->route('documents.liste')->with('success', 'Document ajouté avec succès.');
    }

    public function show($id)
    {
        $document = Document::with('serieArchive.sousSerie', 'user')->findOrFail($id);
        return view('documents.show', compact('document'));
    }

    public function edit($id)
    {
        $document = Document::with('serieArchive.sousSerie')->findOrFail($id);
        return view('documents.edit', compact('document'));
    }

    public function update(Request $request, $id)
    {
        $document = Document::with('serieArchive.sousSerie')->findOrFail($id);

        $request->validate([
            'cote' => 'required|string|max:255',
            'titre' => 'required|string|max:255',
            'analyse' => 'nullable|string',
            'date_enregistrement' => 'required|date',
            'nom_serie' => 'required|string|max:255',
            'libelle_sous_serie' => 'required|string|max:255',
            'statut' => 'required|in:confidentiel,non confidentiel',
            'emplacement' => 'required|string|max:255',
            'fichier' => 'nullable|file|max:204800',
        ]);

        $fichierName = $document->fichier;
        if ($request->hasFile('fichier')) {
            $fichier = $request->file('fichier');
            $fichierName = time() . '_' . $fichier->getClientOriginalName();
            $fichier->move(public_path('uploads'), $fichierName);
        }

        $serieArchive = SerieArchive::firstOrCreate(['nom_serie' => $request->nom_serie]);
        $sousSerie = SousSerie::firstOrCreate([
            'libelle_sous_serie' => $request->libelle_sous_serie,
            'id_serie' => $serieArchive->id,
        ]);

        $document->update([
            'titre' => $request->titre,
            'analyse' => $request->analyse,
            'cote' => $request->cote,
            'date_enregistrement' => $request->date_enregistrement,
            'statut' => $request->statut,
            'emplacement' => $request->emplacement,
            'fichier' => $fichierName,
            'id_serie' => $serieArchive->id,
            'id_sous_serie' => $sousSerie->id,
        ]);

        Historique::create([
            'action' => 'Modification document : ' . $request->titre,
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
            'id_document' => $document->id_document,
        ]);

        return redirect()->route('documents.liste')->with('success', 'Document modifié avec succès.');
    }

    public function destroy($id)
    {
        $document = Document::findOrFail($id);

        Historique::create([
            'action' => 'Suppression document : ' . $document->titre,
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
            'id_document' => $document->id_document,
        ]);

        if ($document->fichier && file_exists(public_path('uploads/' . $document->fichier))) {
            unlink(public_path('uploads/' . $document->fichier));
        }

        $document->delete();

        return redirect()->route('documents.liste')->with('success', 'Document supprimé.');
    }

    public function liste()
    {
        $documents = Document::with('serieArchive.sousSerie', 'user')
            ->orderBy('emplacement', 'asc')
            ->get()
            ->groupBy('emplacement')
            ->map(function ($items) {
                return $items->groupBy(function ($item) {
                    return $item->date_enregistrement ? date('Y', strtotime($item->date_enregistrement)) : 'N/A';
                });
            });

        return view('documents.liste', compact('documents'));
    }

    public function download($id)
    {
        $document = Document::findOrFail($id);
        $user = auth()->user();

        if ($user->isAdmin() || $user->isArchiviste()) {
            $path = public_path('uploads/' . $document->fichier);
            if (!file_exists($path)) {
                return back()->with('error', 'Fichier introuvable.');
            }

            Historique::create([
                'action' => 'Téléchargement',
                'date_action' => now(),
                'id_utilisateur' => $user->id,
                'id_document' => $document->id_document,
            ]);

            return response()->download($path, $document->fichier);
        }

        $demande = $document->demandes()
            ->where('id_utilisateur', $user->id)
            ->where('statut_demande', 'acceptee')
            ->first();

        if (!$demande) {
            return redirect()->route('documents.show', $document->id_document)
                ->with('error', 'Accès non autorisé. Faites une demande d\'accès.');
        }

        $path = public_path('uploads/' . $document->fichier);
        if (!file_exists($path)) {
            return back()->with('error', 'Fichier introuvable.');
        }

        Historique::create([
            'action' => 'Téléchargement',
            'date_action' => now(),
            'id_utilisateur' => $user->id,
            'id_document' => $document->id_document,
        ]);

        return response()->download($path, $document->fichier);
    }
}
