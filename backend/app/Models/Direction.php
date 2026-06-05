<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Direction extends Model
{
    protected $fillable = ['nom_direction'];

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
