<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SerieArchive extends Model
{
    protected $table = 'series_archives';

    protected $fillable = ['nom_serie'];

    public function sousSeries()
    {
        return $this->hasMany(SousSerie::class, 'id_serie');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'id_serie');
    }
}
