<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SousSerie extends Model
{
    protected $fillable = ['libelle_sous_serie', 'id_serie'];

    public function serie()
    {
        return $this->belongsTo(SerieArchive::class, 'id_serie');
    }
}
