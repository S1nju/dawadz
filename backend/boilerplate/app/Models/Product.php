<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'medication_id',
        'qte',
        'prix_achat',
        'prix_vente',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function medication(): BelongsTo
    {
        return $this->belongsTo(Medication::class);
    }

    public function supplierPosts(): HasMany
    {
        return $this->hasMany(SupplierPost::class);
    }

    public function commandeLines(): HasMany
    {
        return $this->hasMany(CommandeLine::class);
    }

    public function factureLines(): HasMany
    {
        return $this->hasMany(FactureLine::class);
    }
}
