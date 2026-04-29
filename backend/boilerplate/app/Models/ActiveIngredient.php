<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ActiveIngredient extends Model
{
    use HasFactory;

    protected $table = 'active_ingredients';

    protected $fillable = [
        'dci',
        'dci_code',
        'created_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function medications(): BelongsToMany
    {
        return $this->belongsToMany(Medication::class, 'medication_active_ingredients')
                    ->withPivot('strength')
                    ->withTimestamps();
    }
}
