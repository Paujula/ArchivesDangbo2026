<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\Auditable;
use App\Traits\FormatsUsers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UsersController extends Controller
{
    use Auditable, FormatsUsers;
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($q = $request->get('q')) {
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($role = $request->get('role')) {
            $query->where('role', $this->unmapRole($role));
        }

        if ($status = $request->get('status')) {
            $query->where('email_verified_at', $status === 'actif' ? '!=' : '=', null);
        }

        return response()->json([
            'users' => $query->get()->map(fn ($u) => $this->formatUser($u)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:chef,admin,saisisseur,consultant',
            'telephone' => 'required|string|max:20',
            'adresse' => 'required|string|max:500',
            'service' => 'required|string|max:255',
            'direction' => 'required|string|max:255',
            'statut_matrimoniale' => 'required|string|max:50',
            'carte' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
            'color' => 'nullable|string|max:7',
            'rights' => 'nullable|array',
        ]);

        $cartePath = '';
        if ($request->hasFile('carte')) {
            $cartePath = $request->file('carte')->store('cartes', 'public');
        }

        $user = User::create([
            'name' => $data['nom'],
            'prenom' => $data['prenom'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $this->unmapRole($data['role']),
            'telephone' => $data['telephone'],
            'adresse' => $data['adresse'],
            'service' => $data['service'],
            'direction' => $data['direction'],
            'statut_matrimoniale' => $data['statut_matrimoniale'],
            'carte' => $cartePath,
            'color' => $data['color'] ?? '#0c6e4a',
            'rights' => $data['rights'] ?? [],
            'initials' => strtoupper(
                mb_substr($data['prenom'] ?? '', 0, 1) . mb_substr($data['nom'] ?? '', 0, 1)
            ),
            'email_verified_at' => now(),
        ]);

        $this->logAction('Création de l\'utilisateur', 'utilisateur', "Utilisateur: {$data['prenom']} {$data['nom']} | Email: {$data['email']} | Rôle: {$data['role']} | Tél: {$data['telephone']} | Adresse: {$data['adresse']} | Service: {$data['service']} | Direction: {$data['direction']} | Statut: {$data['statut_matrimoniale']} | Carte: " . ($cartePath ? 'Téléchargée' : 'Non fournie'));

        return response()->json([
            'user' => $this->formatUser($user),
            'message' => 'Utilisateur créé avec succès.',
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|min:8',
            'role' => 'nullable|in:chef,admin,saisisseur,consultant',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string|max:500',
            'service' => 'nullable|string|max:255',
            'direction' => 'nullable|string|max:255',
            'statut_matrimoniale' => 'nullable|string|max:50',
            'carte' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
            'color' => 'nullable|string|max:7',
            'rights' => 'nullable|array',
            'status' => 'nullable|in:actif,inactif',
        ]);

        if (isset($data['prenom'])) $user->prenom = $data['prenom'];
        if (isset($data['nom'])) $user->name = $data['nom'];
        if (isset($data['email'])) $user->email = $data['email'];
        if (isset($data['password'])) $user->password = Hash::make($data['password']);
        if (isset($data['role'])) $user->role = $this->unmapRole($data['role']);
        if (isset($data['telephone'])) $user->telephone = $data['telephone'];
        if (isset($data['adresse'])) $user->adresse = $data['adresse'];
        if (isset($data['service'])) $user->service = $data['service'];
        if (isset($data['direction'])) $user->direction = $data['direction'];
        if (isset($data['statut_matrimoniale'])) $user->statut_matrimoniale = $data['statut_matrimoniale'];
        if ($request->hasFile('carte')) {
            if ($user->carte) Storage::disk('public')->delete($user->carte);
            $user->carte = $request->file('carte')->store('cartes', 'public');
        }
        if (isset($data['color'])) $user->color = $data['color'];
        if (isset($data['rights'])) $user->rights = $data['rights'];

        if (isset($data['status'])) {
            if ($data['status'] === 'actif' && !$user->email_verified_at) {
                $user->email_verified_at = now();
            } elseif ($data['status'] === 'inactif') {
                $user->email_verified_at = null;
            }
        }

        $original = $user->getOriginal();
        $user->save();

        $changes = [];
        foreach (['name' => 'Nom', 'prenom' => 'Prénom', 'email' => 'Email', 'role' => 'Rôle', 'telephone' => 'Tél', 'adresse' => 'Adresse', 'service' => 'Service', 'direction' => 'Direction', 'statut_matrimoniale' => 'Statut matrimonial'] as $field => $label) {
            if (($user->$field ?? '') !== ($original[$field] ?? '')) {
                $old = $original[$field] ?? '';
                $new = $user->$field ?? '';
                $oldLabel = $field === 'role' ? $this->mapRole($old) : $old;
                $newLabel = $field === 'role' ? $this->mapRole($new) : $new;
                $changes[] = "{$label}: {$oldLabel} → {$newLabel}";
            }
        }
        if (($user->carte ?? '') !== ($original['carte'] ?? '')) {
            $changes[] = 'Carte: modifiée';
        }
        $details = "Utilisateur: {$user->prenom} {$user->name} | " . implode(' | ', $changes ?: ['Aucun changement']);

        $this->logAction('Modification de l\'utilisateur', 'utilisateur', $details);

        return response()->json([
            'user' => $this->formatUser($user),
            'message' => 'Utilisateur modifié avec succès.',
        ]);
    }

    public function deactivate(User $user): JsonResponse
    {
        $authUser = request()->user();
        if ($authUser->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 403);
        }
        if ($user->role === 'admin' && User::where('role', 'admin')->whereNotNull('email_verified_at')->count() <= 1) {
            return response()->json(['message' => 'Impossible de désactiver le dernier administrateur.'], 403);
        }

        $user->email_verified_at = null;
        $user->save();
        $user->tokens()->delete();

        $this->logAction('Désactivation de l\'utilisateur', 'utilisateur', "Utilisateur: {$user->prenom} {$user->name} | Email: {$user->email} | Rôle: " . $this->mapRole($user->role) . " | Service: {$user->service} | Direction: {$user->direction}");

        return response()->json(['message' => 'Utilisateur désactivé avec succès.']);
    }

    public function activate(User $user): JsonResponse
    {
        $user->email_verified_at ??= now();
        $user->save();

        $this->logAction('Activation de l\'utilisateur', 'utilisateur', "Utilisateur: {$user->prenom} {$user->name} | Email: {$user->email} | Rôle: " . $this->mapRole($user->role) . " | Service: {$user->service}");

        return response()->json([
            'user' => $this->formatUser($user),
            'message' => 'Utilisateur réactivé avec succès.',
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $authUser = request()->user();
        if ($authUser->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }
        if ($user->role === 'admin' && User::where('role', 'admin')->whereNotNull('email_verified_at')->count() <= 1) {
            return response()->json(['message' => 'Impossible de supprimer le dernier administrateur.'], 403);
        }

        $carteUrl = $user->carte ? url('storage/' . $user->carte) : '';
        $this->logAction('Suppression de l\'utilisateur', 'utilisateur',
            "Utilisateur: {$user->prenom} {$user->name} | Email: {$user->email} | Rôle: " . $this->mapRole($user->role) . " | " .
            "Téléphone: {$user->telephone} | Adresse: {$user->adresse} | Service: {$user->service} | " .
            "Direction: {$user->direction} | Situation matrimoniale: {$user->statut_matrimoniale} | " .
            "Carte: {$carteUrl}"
        );

        $user->deleted_by = $authUser->id;
        $user->save();
        $user->delete();

        return response()->json(['message' => 'Utilisateur mis à la corbeille.']);
    }

    public function trashed(Request $request): JsonResponse
    {
        $perPage = min((int) ($request->get('per_page', 50)), 100);

        $users = User::with('deleter')
            ->onlyTrashed()
            ->orderBy('deleted_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'users' => $users->map(fn ($u) => [
                'id' => (string) $u->id,
                'name' => $u->name,
                'prenom' => $u->prenom,
                'email' => $u->email,
                'telephone' => $u->telephone,
                'adresse' => $u->adresse,
                'service' => $u->service,
                'direction' => $u->direction,
                'statut_matrimoniale' => $u->statut_matrimoniale,
                'role' => $u->role,
                'carte' => $u->carte ? \Illuminate\Support\Facades\Storage::disk('public')->url($u->carte) : '',
                'deleted_at' => $u->deleted_at?->toIso8601String(),
                'deleter' => $u->deleter ? [
                    'id' => (string) $u->deleter->id,
                    'name' => $u->deleter->name,
                    'prenom' => $u->deleter->prenom,
                ] : null,
            ])->values()->all(),
            'total' => $users->total(),
            'per_page' => $users->perPage(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
        ]);
    }

    public function restore(Request $request, User $user): JsonResponse
    {
        $user->restore();

        $this->logAction('Restauration de l\'utilisateur', 'utilisateur',
            "Utilisateur: {$user->prenom} {$user->name} | Email: {$user->email}"
        );

        return response()->json(['message' => 'Utilisateur restauré avec succès.']);
    }

    public function batchForceDelete(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);

        $users = User::onlyTrashed()->whereIn('id', $request->ids)->get();
        $count = 0;

        foreach ($users as $user) {
            if ($user->carte) {
                Storage::disk('public')->delete($user->carte);
            }
            $user->tokens()->delete();
            $this->logAction('Suppression définitive de l\'utilisateur', 'utilisateur',
                "Utilisateur: {$user->prenom} {$user->name} | Email: {$user->email}"
            );
            $user->forceDelete();
            $count++;
        }

        return response()->json(['message' => "{$count} utilisateur(s) supprimé(s) définitivement."]);
    }

    public function uploadCarte(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'carte' => 'required|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        if ($user->carte) {
            Storage::disk('public')->delete($user->carte);
        }

        $path = $request->file('carte')->store('cartes', 'public');
        $user->carte = $path;
        $user->save();

        return response()->json([
            'carte_url' => Storage::disk('public')->url($path),
            'message' => 'Carte téléchargée avec succès.',
        ]);
    }
}
