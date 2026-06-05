<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $primaryKey = 'id_document';

    protected $fillable = [
        'cote', 'titre', 'analyse', 'date_enregistrement', 'statut',
        'emplacement', 'fichier', 'original_name', 'id_serie', 'id_sous_serie', 'user_id',
        'ref', 'service_id', 'direction_id',
        'format', 'pages', 'keywords', 'restricted', 'views', 'size', 'indexed_by',
    ];

    protected function casts(): array
    {
        return [
            'date_enregistrement' => 'datetime',
            'keywords' => 'json',
            'restricted' => 'boolean',
        ];
    }

    public function serieArchive()
    {
        return $this->belongsTo(SerieArchive::class, 'id_serie');
    }

    public function sousSerie()
    {
        return $this->belongsTo(SousSerie::class, 'id_sous_serie');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function direction()
    {
        return $this->belongsTo(Direction::class);
    }

    public function demandes()
    {
        return $this->hasMany(Demande::class, 'id_document');
    }

    public function historiques()
    {
        return $this->hasMany(Historique::class, 'id_document');
    }
}
