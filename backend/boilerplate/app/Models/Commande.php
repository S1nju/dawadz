<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Commande extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'supplier_id',
        'external_supplier_name',
        'status',
        'ordered_at',
        'confirmed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'ordered_at' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CommandeLine::class);
    }

    public function facture(): HasOne
    {
        return $this->hasOne(Facture::class);
    }
}
