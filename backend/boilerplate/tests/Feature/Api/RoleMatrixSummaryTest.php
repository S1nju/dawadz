<?php

use App\Models\ApprovalRequest;
use App\Models\Pharmacy;
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

function makeUserWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

it('lets a user create and inspect only their own approval requests', function () {
    $user = makeUserWithRole('user');
    $other = makeUserWithRole('user');

    ApprovalRequest::create([
        'user_id' => $other->id,
        'type' => 'supplier',
        'status' => 'pending',
        'documents' => [],
        'images' => [],
    ]);

    Sanctum::actingAs($user);

    $this->postJson('/api/approval-requests', [
        'type' => 'pharmacy',
        'documents' => [],
        'images' => [],
    ])->assertCreated();

    $response = $this->getJson('/api/approval-requests');
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

it('keeps pharmacy data isolated for pharmacy admins', function () {
    $pharmacyUser = makeUserWithRole('pharmacy_admin');
    $pharmacy = Pharmacy::create([
        'owner_id' => $pharmacyUser->id,
        'name' => 'One',
        'address' => 'Street 1',
        'latitude' => 33.1,
        'longitude' => -7.2,
        'registre_commerce_number' => 'RC-4001',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    $otherPharmacyUser = makeUserWithRole('pharmacy_admin');
    Pharmacy::create([
        'owner_id' => $otherPharmacyUser->id,
        'name' => 'Two',
        'address' => 'Street 2',
        'latitude' => 33.2,
        'longitude' => -7.3,
        'registre_commerce_number' => 'RC-4002',
        'time_open' => '08:00:00',
        'time_closes' => '20:00:00',
    ]);

    Sanctum::actingAs($pharmacyUser);

    $this->getJson('/api/pharmacies/'.$pharmacy->id)->assertOk();
    $this->getJson('/api/pharmacies/'.$otherPharmacyUser->pharmacy->id)->assertForbidden();
});

it('excludes pharmacies within 5km from nearby search results', function () {
    $pharmacyOwnerOne = makeUserWithRole('pharmacy_admin');
    $pharmacyOwnerTwo = makeUserWithRole('pharmacy_admin');

    $nearby = Pharmacy::create([
        'owner_id' => $pharmacyOwnerOne->id,
        'name' => 'Oran Central Pharmacy',
        'address' => 'Place du 1er Novembre, Oran',
        'city' => 'Oran',
        'latitude' => 35.6971,
        'longitude' => -0.6308,
        'registre_commerce_number' => 'RC-5001',
        'time_open' => '08:00:00',
        'time_closes' => '22:00:00',
    ]);

    $farther = Pharmacy::create([
        'owner_id' => $pharmacyOwnerTwo->id,
        'name' => 'Oran Corniche Pharmacy',
        'address' => 'Boulevard de la Corniche, Oran',
        'city' => 'Oran',
        'latitude' => 35.7571,
        'longitude' => -0.6308,
        'registre_commerce_number' => 'RC-5002',
        'time_open' => '09:00:00',
        'time_closes' => '21:00:00',
    ]);

    $response = $this->getJson('/api/pharmacies/nearby?latitude=35.6971&longitude=-0.6308&radius_km=10');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($farther->id);
});

it('fetches nearby pharmacies by city without passing coordinates', function () {
    $pharmacyOwnerOne = makeUserWithRole('pharmacy_admin');
    $pharmacyOwnerTwo = makeUserWithRole('pharmacy_admin');

    Pharmacy::create([
        'owner_id' => $pharmacyOwnerOne->id,
        'name' => 'Oran Center City Pharmacy',
        'address' => 'Place du 1er Novembre, Oran',
        'city' => 'Oran',
        'latitude' => 35.6971,
        'longitude' => -0.6308,
        'registre_commerce_number' => 'RC-5005',
        'time_open' => '08:00:00',
        'time_closes' => '22:00:00',
    ]);

    $farther = Pharmacy::create([
        'owner_id' => $pharmacyOwnerTwo->id,
        'name' => 'Oran Outskirts City Pharmacy',
        'address' => 'Es Senia, Oran',
        'city' => 'Oran',
        'latitude' => 35.7571,
        'longitude' => -0.6308,
        'registre_commerce_number' => 'RC-5006',
        'time_open' => '09:00:00',
        'time_closes' => '21:00:00',
    ]);

    $response = $this->getJson('/api/pharmacies/nearby?city=Oran&radius_km=10');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($farther->id);
});

it('excludes pharmacies within 5km on the pharmacies list when coordinates are provided', function () {
    $pharmacyOwnerOne = makeUserWithRole('pharmacy_admin');
    $pharmacyOwnerTwo = makeUserWithRole('pharmacy_admin');

    Pharmacy::create([
        'owner_id' => $pharmacyOwnerOne->id,
        'name' => 'Oran Center List Pharmacy',
        'address' => 'Place du 1er Novembre, Oran',
        'city' => 'Oran',
        'latitude' => 35.6971,
        'longitude' => -0.6308,
        'registre_commerce_number' => 'RC-5003',
        'time_open' => '08:00:00',
        'time_closes' => '22:00:00',
    ]);

    $farther = Pharmacy::create([
        'owner_id' => $pharmacyOwnerTwo->id,
        'name' => 'Oran Outskirts List Pharmacy',
        'address' => 'Es Senia, Oran',
        'city' => 'Oran',
        'latitude' => 35.7571,
        'longitude' => -0.6308,
        'registre_commerce_number' => 'RC-5004',
        'time_open' => '09:00:00',
        'time_closes' => '21:00:00',
    ]);

    $response = $this->getJson('/api/pharmacies?latitude=35.6971&longitude=-0.6308&radius_km=10');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($farther->id);
});

it('lets a supplier admin manage their supplier profile only', function () {
    $supplierUser = makeUserWithRole('supplier_admin');
    $supplier = Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    $otherSupplierUser = makeUserWithRole('supplier_admin');
    $otherSupplier = Supplier::create([
        'user_id' => $otherSupplierUser->id,
        'company_name' => 'Other Supplier',
        'address' => 'Other Street',
    ]);

    Sanctum::actingAs($supplierUser);

    $this->getJson('/api/suppliers/'.$supplier->id)->assertOk();
    $this->getJson('/api/suppliers/'.$otherSupplier->id)->assertForbidden();
});
