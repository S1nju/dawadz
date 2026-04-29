<?php

use App\Models\Country;
use App\Models\Laboratory;
use App\Models\Medication;
use App\Models\PharmaceuticalForm;
use App\Models\Pharmacy;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierPost;
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

function marketplaceUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function marketplaceMed(User $owner): Medication
{
    $lab = Laboratory::create(['name' => 'Market Lab', 'country' => 'MA']);
    $form = PharmaceuticalForm::create(['name' => 'Tablet']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);

    return Medication::create([
        'name' => 'MarketMed',
        'commercial_name' => 'Market Brand',
        'laboratory_id' => $lab->id,
        'pharmaceutical_form_id' => $form->id,
        'country_id' => $country->id,
        'type' => 'generic',
        'list' => 'free',
        'created_by' => $owner->id,
    ]);
}

it('lets a supplier admin manage products and supplier posts', function () {
    $supplierUser = marketplaceUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supply Co',
        'address' => 'Supply Street',
    ]);

    $medication = marketplaceMed($supplierUser);
    Sanctum::actingAs($supplierUser);

    $productResponse = $this->postJson('/api/products', [
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 10,
        'prix_achat' => 5,
        'prix_vente' => 9,
    ]);

    $productResponse->assertCreated();
    $productId = $productResponse->json('id');

    $this->postJson('/api/supplier-posts', [
        'supplier_id' => $supplier->id,
        'product_id' => $productId,
        'title' => 'Available today',
        'description' => 'New stock arrived',
        'qte_vente' => 4,
    ])->assertCreated();

    $this->getJson('/api/suppliers')->assertOk();
});

it('lets a supplier admin see only their own supplier posts', function () {
    $supplierUser = marketplaceUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supply Co',
        'address' => 'Supply Street',
    ]);

    $otherSupplierUser = marketplaceUser('supplier_admin');
    $otherSupplier = Supplier::create([
        'user_id' => $otherSupplierUser->id,
        'company_name' => 'Other Supply Co',
        'address' => 'Other Street',
    ]);

    $medication = marketplaceMed($supplierUser);
    $product = Product::create([
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 10,
        'prix_achat' => 5,
        'prix_vente' => 9,
    ]);

    $otherProduct = Product::create([
        'supplier_id' => $otherSupplier->id,
        'medication_id' => $medication->id,
        'qte' => 12,
        'prix_achat' => 6,
        'prix_vente' => 10,
    ]);

    SupplierPost::create([
        'supplier_id' => $supplier->id,
        'product_id' => $product->id,
        'title' => 'My feed post',
        'description' => 'Visible only to me',
        'qte_vente' => 2,
    ]);

    $otherPost = SupplierPost::create([
        'supplier_id' => $otherSupplier->id,
        'product_id' => $otherProduct->id,
        'title' => 'Other feed post',
        'description' => 'Not visible to me',
        'qte_vente' => 1,
    ]);

    Sanctum::actingAs($supplierUser);

    $this->getJson('/api/supplier-posts')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.supplier_id', $supplier->id);

    $this->getJson('/api/supplier-posts/' . $otherPost->id)
        ->assertForbidden();

    $this->postJson('/api/commandes', [
        'supplier_id' => $supplier->id,
        'lines' => [[
            'product_id' => $product->id,
            'medication_name' => 'MarketMed',
            'qte' => 2,
            'unit_price' => 9,
        ]],
    ])->assertForbidden();
});

it('lets a pharmacy admin see all supplier posts', function () {
    $pharmacyUser = marketplaceUser('pharmacy_admin');
    Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'City Pharmacy',
        'address' => 'City Street',
        'city' => 'Oran',
        'latitude' => 35.70,
        'longitude' => -0.63,
        'registre_commerce_number' => 'RC-MKT-PH-1',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $supplierUser = marketplaceUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supply Co',
        'address' => 'Supply Street',
    ]);

    $otherSupplierUser = marketplaceUser('supplier_admin');
    $otherSupplier = Supplier::create([
        'user_id' => $otherSupplierUser->id,
        'company_name' => 'Other Supply Co',
        'address' => 'Other Street',
    ]);

    $medication = marketplaceMed($pharmacyUser);
    $product = Product::create([
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 10,
        'prix_achat' => 5,
        'prix_vente' => 9,
    ]);

    $otherProduct = Product::create([
        'supplier_id' => $otherSupplier->id,
        'medication_id' => $medication->id,
        'qte' => 12,
        'prix_achat' => 6,
        'prix_vente' => 10,
    ]);

    SupplierPost::create([
        'supplier_id' => $supplier->id,
        'product_id' => $product->id,
        'title' => 'Supplier one post',
        'description' => 'Visible to pharmacy owner',
        'qte_vente' => 2,
    ]);

    SupplierPost::create([
        'supplier_id' => $otherSupplier->id,
        'product_id' => $otherProduct->id,
        'title' => 'Supplier two post',
        'description' => 'Also visible to pharmacy owner',
        'qte_vente' => 1,
    ]);

    Sanctum::actingAs($pharmacyUser);

    $this->getJson('/api/supplier-posts')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('blocks pharmacy-only inventory routes from supplier admins', function () {
    $supplierUser = marketplaceUser('supplier_admin');
    Sanctum::actingAs($supplierUser);

    $this->getJson('/api/inventories')->assertForbidden();
});
