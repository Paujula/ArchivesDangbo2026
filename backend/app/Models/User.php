<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name', 'prenom', 'email', 'password', 'telephone', 'adresse',
    'service', 'direction', 'statut_matrimoniale', 'role', 'carte'
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'rights' => 'json',
        ];
    }

    public function demandes()
    {
        return $this->hasMany(Demande::class, 'id_utilisateur');
    }

    public function historiques()
    {
        return $this->hasMany(Historique::class, 'id_utilisateur');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isArchiviste(): bool
    {
        return $this->role === 'archiviste';
    }

    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    public function hasRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }
}
