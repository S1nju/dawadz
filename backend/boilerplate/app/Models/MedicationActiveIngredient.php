<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MedicationActiveIngredient extends Model
{
    use HasFactory;

    protected $table = 'medication_active_ingredients';

    protected $fillable = [
        'medication_id',
        'active_ingredient_id',
        'strength',
    ];
}
