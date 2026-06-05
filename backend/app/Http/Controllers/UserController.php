<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Historique;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();
        return view('users.index', compact('users'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string|max:255',
            'service' => 'nullable|string|max:255',
            'direction' => 'nullable|string|max:255',
            'statut_matrimoniale' => 'nullable|string|max:255',
            'role' => 'required|in:admin,archiviste,agent',
            'password' => 'required|string|min:6',
            'carte' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $carte = '';
        if ($request->hasFile('carte')) {
            $carte = time() . '_' . $request->file('carte')->getClientOriginalName();
            $request->file('carte')->move(public_path('uploads'), $carte);
        }

        User::create([
            'name' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'telephone' => $request->telephone,
            'adresse' => $request->adresse,
            'service' => $request->service,
            'direction' => $request->direction,
            'statut_matrimoniale' => $request->statut_matrimoniale,
            'role' => $request->role,
            'password' => bcrypt($request->password),
            'carte' => $carte,
        ]);

        Historique::create([
            'action' => 'Ajout utilisateur : ' . $request->email,
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
        ]);

        return redirect()->route('users.index')->with('success', 'Utilisateur ajouté.');
    }

    public function edit($id)
    {
        $user = User::findOrFail($id);
        return view('users.edit', compact('user'));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string|max:255',
            'service' => 'nullable|string|max:255',
            'direction' => 'nullable|string|max:255',
            'statut_matrimoniale' => 'nullable|string|max:255',
            'role' => 'required|in:admin,archiviste,agent',
            'password' => 'nullable|string|min:6',
            'carte' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $data = [
            'name' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'telephone' => $request->telephone,
            'adresse' => $request->adresse,
            'service' => $request->service,
            'direction' => $request->direction,
            'statut_matrimoniale' => $request->statut_matrimoniale,
            'role' => $request->role,
        ];

        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->password);
        }

        if ($request->hasFile('carte')) {
            $data['carte'] = time() . '_' . $request->file('carte')->getClientOriginalName();
            $request->file('carte')->move(public_path('uploads'), $data['carte']);
        }

        $user->update($data);

        Historique::create([
            'action' => 'Modification utilisateur : ' . $request->email,
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
        ]);

        return redirect()->route('users.index')->with('success', 'Utilisateur modifié.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        Historique::create([
            'action' => 'Suppression utilisateur : ' . $user->email,
            'date_action' => now(),
            'id_utilisateur' => auth()->id(),
        ]);

        if ($user->carte && file_exists(public_path('uploads/' . $user->carte))) {
            unlink(public_path('uploads/' . $user->carte));
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'Utilisateur supprimé.');
    }
}
