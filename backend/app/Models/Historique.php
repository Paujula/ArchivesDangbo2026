<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Historique extends Model
{
    protected $fillable = [
        'action', 'type', 'details', 'date_action', 'id_utilisateur', 'id_document'
    ];

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
    }

    public function document()
    {
        return $this->belongsTo(Document::class, 'id_document');
    }
}
