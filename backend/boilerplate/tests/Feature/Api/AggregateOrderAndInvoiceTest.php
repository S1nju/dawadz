<?php

use App\Models\Commande;
use App\Models\Facture;
use App\Models\Country;
use App\Models\Laboratory;
use App\Models\Inventory;
use App\Models\Medication;
use App\Models\PharmaceuticalForm;
use App\Models\Pharmacy;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['user', 'admin', 'supplier_admin', 'pharmacy_admin'] as $role) {
        Role::findOrCreate($role);
    }
});

function makeRoleUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

it('creates a commande with embedded lines for a pharmacy admin', function () {
    $pharmacyUser = makeRoleUser('pharmacy_admin');
    $pharmacy = Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'Main Pharmacy',
        'address' => 'Pharmacy Street',
        'latitude' => 33.59,
        'longitude' => -7.61,
        'registre_commerce_number' => 'RC-3001',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $supplierUser = makeRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $lab = Laboratory::create(['name' => 'Lab C', 'country' => 'MA']);
    $form = PharmaceuticalForm::create(['name' => 'Tablet C']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $medication = Medication::create([
        'name' => 'Amoxicillin',
        'commercial_name' => 'Amox',
        'laboratory_id' => $lab->id,
        'country_id' => $country->id,
        'pharmaceutical_form_id' => $form->id,
        'type' => 'generic',
        'list' => 'free',
        'created_by' => $pharmacyUser->id,
    ]);

    $product = Product::create([
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 50,
        'prix_achat' => 4,
        'prix_vente' => 7,
    ]);

    Sanctum::actingAs($pharmacyUser);

    $response = $this->postJson('/api/commandes', [
        'supplier_id' => $supplier->id,
        'lines' => [
            [
                'product_id' => $product->id,
                'medication_name' => 'Amoxicillin',
                'qte' => 3,
                'unit_price' => 7,
            ],
        ],
    ]);

    $response->assertCreated();

    expect(Commande::count())->toBe(1);
    expect(Commande::first()->lines)->toHaveCount(1);
});

it('lets a supplier admin confirm their commande', function () {
    $pharmacyUser = makeRoleUser('pharmacy_admin');
    $pharmacy = Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'Main Pharmacy',
        'address' => 'Pharmacy Street',
        'latitude' => 33.59,
        'longitude' => -7.61,
        'registre_commerce_number' => 'RC-3002',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $supplierUser = makeRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $lab = Laboratory::create(['name' => 'Lab D', 'country' => 'MA']);
    $form = PharmaceuticalForm::create(['name' => 'Capsule D']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $medication = Medication::create([
        'name' => 'Ibuprofen',
        'commercial_name' => 'Ibu',
        'laboratory_id' => $lab->id,
        'country_id' => $country->id,
        'pharmaceutical_form_id' => $form->id,
        'type' => 'generic',
        'list' => 'free',
        'created_by' => $pharmacyUser->id,
    ]);

    $product = Product::create([
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 50,
        'prix_achat' => 4,
        'prix_vente' => 7,
    ]);

    $commande = Commande::create([
        'pharmacy_id' => $pharmacy->id,
        'supplier_id' => $supplier->id,
        'status' => 'pending',
        'ordered_at' => now(),
    ]);

    $commande->lines()->create([
        'product_id' => $product->id,
        'medication_name' => 'Ibuprofen',
        'qte' => 2,
        'unit_price' => 7,
        'total' => 14,
    ]);

    Sanctum::actingAs($supplierUser);

    $this->patchJson("/api/commandes/{$commande->id}/confirm")
        ->assertOk();

    expect($commande->fresh()->status)->toBe('confirmed');
    expect($commande->fresh()->confirmed_at)->not->toBeNull();
});

it('lets a supplier admin refuse their commande', function () {
    $pharmacyUser = makeRoleUser('pharmacy_admin');
    $pharmacy = Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'Main Pharmacy',
        'address' => 'Pharmacy Street',
        'latitude' => 33.59,
        'longitude' => -7.61,
        'registre_commerce_number' => 'RC-3002-REFUSE',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $supplierUser = makeRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $commande = Commande::create([
        'pharmacy_id' => $pharmacy->id,
        'supplier_id' => $supplier->id,
        'status' => 'pending',
        'ordered_at' => now(),
    ]);

    Sanctum::actingAs($supplierUser);

    $this->patchJson("/api/commandes/{$commande->id}/refuse")
        ->assertOk();

    expect($commande->fresh()->status)->toBe('cancelled');
});

it('creates a facture with embedded lines for a pharmacy admin', function () {
    $pharmacyUser = makeRoleUser('pharmacy_admin');
    $pharmacy = Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'Main Pharmacy',
        'address' => 'Pharmacy Street',
        'latitude' => 33.59,
        'longitude' => -7.61,
        'registre_commerce_number' => 'RC-3003',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $supplierUser = makeRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $lab = Laboratory::create(['name' => 'Lab E', 'country' => 'MA']);
    $form = PharmaceuticalForm::create(['name' => 'Syrup E']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $commande = Commande::create([
        'pharmacy_id' => $pharmacy->id,
        'supplier_id' => $supplier->id,
        'status' => 'confirmed',
        'ordered_at' => now(),
        'confirmed_at' => now(),
    ]);

    Sanctum::actingAs($pharmacyUser);

    $response = $this->postJson('/api/factures', [
        'commande_id' => $commande->id,
        'supplier_id' => $supplier->id,
        'lines' => [
            [
                'medication_name' => 'Paracetamol',
                'qte' => 5,
                'unit_price' => 3,
            ],
        ],
    ]);

    $response->assertCreated();

    expect(Facture::count())->toBe(1);
    expect(Facture::first()->lines)->toHaveCount(1);
});
