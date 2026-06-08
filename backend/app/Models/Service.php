<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'direction_id'];

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function direction()
    {
        return $this->belongsTo(Direction::class);
    }
}
