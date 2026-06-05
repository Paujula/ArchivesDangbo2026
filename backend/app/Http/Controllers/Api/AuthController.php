<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\Auditable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use Auditable;

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $user->last_login_at = now();
        $user->save();

        $token = $user->createToken('api-token')->plainTextToken;

        $this->logAction('Connexion', 'authentification', "Nom: {$user->name} | Prénom: {$user->prenom} | Email: {$user->email} | Rôle: {$user->role}", documentId: null, requestOrUserId: (int) $user->id);

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        $this->logAction('Déconnexion', 'authentification', "Nom: {$user->name} | Prénom: {$user->prenom} | Email: {$user->email} | Rôle: {$user->role}");

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)]);
        }

        return response()->json(['message' => __($status)], 400);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)]);
        }

        return response()->json(['message' => __($status)], 400);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.'], 400);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        $this->logAction('Changement de mot de passe', 'authentification', "Utilisateur: {$user->name} | Prénom: {$user->prenom} | Email: {$user->email}");

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'nom' => $user->name,
            'prenom' => $user->prenom ?? '',
            'name' => $user->prenom ? trim($user->prenom . ' ' . $user->name) : $user->name,
            'email' => $user->email,
            'telephone' => $user->telephone ?? '',
            'adresse' => $user->adresse ?? '',
            'service' => $user->service ?? '',
            'direction' => $user->direction ?? '',
            'statut_matrimoniale' => $user->statut_matrimoniale ?? '',
            'carte' => $user->carte ?? '',
            'initials' => $user->initials ?? strtoupper(substr($user->name, 0, 1)),
            'role' => $this->mapRole($user->role),
            'color' => $user->color ?? '#0c6e4a',
            'status' => $user->email_verified_at ? 'actif' : 'inactif',
            'rights' => $user->rights ?? [],
            'last_login_at' => $user->last_login_at
                ? (is_string($user->last_login_at) ? $user->last_login_at : $user->last_login_at->toIso8601String())
                : null,
        ];
    }

    private function mapRole(?string $role): string
    {
        return match ($role) {
            'admin' => 'admin',
            'chef' => 'chef',
            'archiviste' => 'saisisseur',
            'agent' => 'consultant',
            default => 'consultant',
        };
    }
}
