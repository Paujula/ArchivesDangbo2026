<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use App\Models\Document;
use App\Models\Historique;
use Illuminate\Http\Request;

class DemandeController extends Controller
{
    public function create($idDocument)
    {
        $document = Document::findOrFail($idDocument);
        return view('demandes.create', compact('document'));
    }

    public function store(Request $request, $idDocument)
    {
        $document = Document::findOrFail($idDocument);

        $request->validate([
            'objet' => 'required|string|max:1000',
        ]);

        Demande::create([
            'date_demande' => now(),
            'objet' => $request->objet,
            'statut_demande' => 'en_attente',
            'id_document' => $document->id_document,
            'id_utilisateur' => auth()->id(),
        ]);

        Historique::create([
            'action' => 'Demande accès document',
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
            'id_document' => $document->id_document,
        ]);

        return redirect()->route('demandes.mes')->with('success', 'Demande envoyée.');
    }

    public function mesDemandes()
    {
        $demandes = Demande::with('document.serieArchive')
            ->where('id_utilisateur', auth()->id())
            ->orderBy('date_demande', 'desc')
            ->get();

        return view('demandes.mes', compact('demandes'));
    }

    public function index()
    {
        $demandes = Demande::with('utilisateur', 'document.serieArchive')
            ->orderBy('date_demande', 'desc')
            ->get();

        return view('demandes.index', compact('demandes'));
    }

    public function accepter($id)
    {
        $demande = Demande::findOrFail($id);
        $demande->update(['statut_demande' => 'acceptee']);

        Historique::create([
            'action' => 'Demande acceptée',
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
            'id_document' => $demande->id_document,
        ]);

        return redirect()->route('demandes.index')->with('success', 'Demande acceptée.');
    }

    public function refuser($id)
    {
        $demande = Demande::findOrFail($id);
        $demande->update(['statut_demande' => 'refusee']);

        Historique::create([
            'action' => 'Demande refusée',
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
            'id_document' => $demande->id_document,
        ]);

        return redirect()->route('demandes.index')->with('success', 'Demande refusée.');
    }
}
