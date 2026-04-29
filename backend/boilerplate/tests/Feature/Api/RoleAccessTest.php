<?php

use App\Models\ApprovalRequest;
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
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['user', 'admin', 'supplier_admin', 'pharmacy_admin'] as $role) {
        Role::findOrCreate($role);
    }
});

function createRoleUser(string $role, array $attributes = []): User
{
    $user = User::factory()->create($attributes);
    $user->assignRole($role);

    return $user;
}

it('allows public medication and pharmacy discovery without auth', function () {
    Laboratory::create(['name' => 'Lab One', 'country' => 'MA']);
    Country::create(['name' => 'Morocco', 'code' => 'MAR']);

    $response = $this->getJson('/api/medications');
    $response->assertUnauthorized();

    $response = $this->getJson('/api/pharmacies');
    $response->assertOk();
});

it('blocks regular users from creating medicines and lookup models', function () {
    $user = createRoleUser('user');
    Sanctum::actingAs($user);

    $this->postJson('/api/medications', [
        'name' => 'Paracetamol',
        'laboratory_id' => 1,
        'pharmaceutical_form_id' => 1,
        'type' => 'generic',
        'list' => 'free',
    ])->assertForbidden();

    $this->postJson('/api/laboratories', [
        'name' => 'Lab Two',
        'country' => 'MA',
    ])->assertForbidden();
});

it('allows admin to see platform data but not manage lookup entities', function () {
    $admin = createRoleUser('admin');
    Sanctum::actingAs($admin);

    $this->postJson('/api/laboratories', [
        'name' => 'Central Lab',
        'country' => 'MA',
    ])->assertForbidden();

    $supplierUser = createRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $pharmacyUser = createRoleUser('pharmacy_admin');
    Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'Pharmacy One',
        'address' => 'Pharmacy Street',
        'latitude' => 33.5,
        'longitude' => -7.6,
        'registre_commerce_number' => 'RC-2001',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    ApprovalRequest::create([
        'user_id' => $supplierUser->id,
        'type' => 'supplier',
        'status' => 'pending',
        'documents' => [],
        'images' => [],
    ]);

    $this->getJson('/api/suppliers')->assertOk();
    $this->getJson('/api/approval-requests')->assertOk();
});

it('allows pharmacy admins to manage lookup entities', function () {
    $pharmacyAdmin = createRoleUser('pharmacy_admin');
    Sanctum::actingAs($pharmacyAdmin);

    $this->postJson('/api/laboratories', [
        'name' => 'Central Lab',
        'country' => 'MA',
    ])->assertCreated();

    $this->postJson('/api/countries', [
        'name' => 'Morocco',
        'code' => 'MAR',
    ])->assertCreated();
});

it('allows supplier admins to create products and supplier posts but blocks inventory routes', function () {
    $supplierUser = createRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $lab = Laboratory::create(['name' => 'Lab A', 'country' => 'MA']);
    $form = PharmaceuticalForm::create(['name' => 'Tablet']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $medication = Medication::create([
        'name' => 'Medicine A',
        'commercial_name' => 'Brand A',
        'laboratory_id' => $lab->id,
        'country_id' => $country->id,
        'pharmaceutical_form_id' => $form->id,
        'type' => 'generic',
        'list' => 'free',
        'created_by' => $supplierUser->id,
    ]);

    Sanctum::actingAs($supplierUser);

    $this->postJson('/api/products', [
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 10,
        'prix_achat' => 5,
        'prix_vente' => 8,
    ])->assertCreated();

    $product = Product::first();

    $this->postJson('/api/supplier-posts', [
        'supplier_id' => $supplier->id,
        'product_id' => $product->id,
        'title' => 'Selling today',
        'description' => 'Limited stock',
        'qte_vente' => 3,
    ])->assertCreated();

    $this->postJson('/api/inventories', [
        'pharmacy_id' => 1,
        'medication_id' => $medication->id,
        'qte' => 2,
        'prix_achat' => 5,
        'prix_vente' => 7,
    ])->assertForbidden();
});

it('allows supplier admins to access their own marketplace feed and manage pharmacy inventory and orders', function () {
    $supplierUser = createRoleUser('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $pharmacyUser = createRoleUser('pharmacy_admin');
    $pharmacy = Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'Pharmacy One',
        'address' => 'Pharmacy Street',
        'latitude' => 33.5,
        'longitude' => -7.6,
        'registre_commerce_number' => 'RC-2002',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $lab = Laboratory::create(['name' => 'Lab B', 'country' => 'MA']);
    $form = PharmaceuticalForm::create(['name' => 'Capsule']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $medication = Medication::create([
        'name' => 'Medicine B',
        'commercial_name' => 'Brand B',
        'laboratory_id' => $lab->id,
        'country_id' => $country->id,
        'pharmaceutical_form_id' => $form->id,
        'type' => 'generic',
        'list' => 'free',
        'created_by' => $supplierUser->id,
    ]);

    $product = Product::create([
        'supplier_id' => $supplier->id,
        'medication_id' => $medication->id,
        'qte' => 20,
        'prix_achat' => 5,
        'prix_vente' => 9,
    ]);

    SupplierPost::create([
        'supplier_id' => $supplier->id,
        'product_id' => $product->id,
        'title' => 'Market post',
        'description' => 'Feed post',
        'qte_vente' => 4,
    ]);

    Sanctum::actingAs($supplierUser);

    $this->getJson('/api/supplier-posts')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->postJson('/api/inventories', [
        'pharmacy_id' => $pharmacy->id,
        'medication_id' => $medication->id,
        'qte' => 4,
        'prix_achat' => 6,
        'prix_vente' => 10,
    ])->assertForbidden();

    $this->postJson('/api/commandes', [
        'pharmacy_id' => $pharmacy->id,
        'supplier_id' => $supplier->id,
        'status' => 'pending',
        'lines' => [
            [
                'product_id' => $product->id,
                'medication_name' => 'Medicine B',
                'qte' => 2,
                'unit_price' => 9,
            ],
        ],
    ])->assertForbidden();
});
