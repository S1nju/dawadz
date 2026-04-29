<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'commercial_name',
        'laboratory_id',
        'therapeutic_class_id',
        'pharmacological_class_id',
        'pharmaceutical_form_id',
        'country_id',
        'dosage',
        'conditioning',
        'type',
        'list',
        'marketed',
        'reimbursable',
        'registration_num',
        'notice_link',
        'img_link',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'marketed' => 'boolean',
            'reimbursable' => 'boolean',
        ];
    }

    // Relations to lookup tables
    public function laboratory(): BelongsTo
    {
        return $this->belongsTo(Laboratory::class);
    }

    public function therapeuticClass(): BelongsTo
    {
        return $this->belongsTo(TherapeuticClass::class);
    }

    public function pharmacologicalClass(): BelongsTo
    {
        return $this->belongsTo(PharmacologicalClass::class);
    }

    public function pharmaceuticalForm(): BelongsTo
    {
        return $this->belongsTo(PharmaceuticalForm::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Many-to-many with active ingredients (DCI)
    public function activeIngredients(): BelongsToMany
    {
        return $this->belongsToMany(ActiveIngredient::class, 'medication_active_ingredients')
                    ->withPivot('strength')
                    ->withTimestamps();
    }

    // Relations to business domain
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }
}
