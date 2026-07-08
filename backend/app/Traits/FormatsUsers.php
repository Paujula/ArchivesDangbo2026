<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

trait FormatsUsers
{
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
            'carte' => $user->carte ? Storage::disk('public')->url($user->carte) : '',
            'initials' => $user->initials ?? strtoupper(mb_substr($user->name, 0, 2)),
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

    private function unmapRole(string $role): string
    {
        return match ($role) {
            'chef' => 'chef',
            'admin' => 'admin',
            'saisisseur' => 'archiviste',
            'consultant' => 'agent',
            default => 'agent',
        };
    }
}
