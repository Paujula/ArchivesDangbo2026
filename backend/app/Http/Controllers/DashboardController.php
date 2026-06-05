<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\User;
use App\Models\Demande;
use App\Models\Historique;

class DashboardController extends Controller
{
    public function index()
    {
        $totalDocuments = Document::count();
        $totalUsers = User::count();
        $totalDemandes = Demande::count();
        $totalActions = Historique::count();

        $recentActivity = Historique::with('utilisateur', 'document')
            ->orderBy('date_action', 'desc')
            ->limit(10)
            ->get();

        $topUsers = Historique::selectRaw('id_utilisateur, COUNT(*) as total')
            ->with('utilisateur')
            ->groupBy('id_utilisateur')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        $actionsStats = Historique::selectRaw('action, COUNT(*) as total')
            ->groupBy('action')
            ->orderBy('total', 'desc')
            ->get();

        $documentsParStatut = Document::selectRaw('statut, COUNT(*) as total')
            ->groupBy('statut')
            ->get();

        return view('dashboard', compact(
            'totalDocuments', 'totalUsers', 'totalDemandes', 'totalActions',
            'recentActivity', 'topUsers', 'actionsStats', 'documentsParStatut'
        ));
    }
}
