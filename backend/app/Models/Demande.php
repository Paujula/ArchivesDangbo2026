<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Demande extends Model
{
    protected $primaryKey = 'id_demande';

    protected $fillable = [
        'date_demande', 'objet', 'type', 'statut_demande',
        'id_document', 'id_utilisateur', 'traite_par'
    ];

    public function document()
    {
        return $this->belongsTo(Document::class, 'id_document');
    }

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
    }

    public function traitePar()
    {
        return $this->belongsTo(User::class, 'traite_par');
    }
}
