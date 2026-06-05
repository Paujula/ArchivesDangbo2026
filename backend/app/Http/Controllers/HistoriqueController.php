<?php

namespace App\Http\Controllers;

use App\Models\Historique;

class HistoriqueController extends Controller
{
    public function index()
    {
        $historiques = Historique::with('utilisateur', 'document')
            ->orderBy('date_action', 'desc')
            ->paginate(50);

        return view('historique.index', compact('historiques'));
    }
}
