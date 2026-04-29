<?php

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

function roleUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

it('blocks a regular user from supplier management routes', function () {
    $user = roleUser('user');
    Sanctum::actingAs($user);

    $this->getJson('/api/suppliers')->assertForbidden();
    $this->postJson('/api/products', [
        'medication_id' => 1,
        'qte' => 1,
        'prix_achat' => 1,
        'prix_vente' => 2,
    ])->assertForbidden();
});

it('allows a supplier admin to access only their own supplier posts feed', function () {
    $supplierUser = roleUser('supplier_admin');
    Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    Sanctum::actingAs($supplierUser);

    $this->getJson('/api/supplier-posts')->assertOk();
});

it('allows a supplier admin to see only supplier data routes and blocks pharmacy-only inventory feed', function () {
    $supplierUser = roleUser('supplier_admin');
    Supplier::create([
        'user_id' => $supplierUser->id,
        'company_name' => 'Supplier Co',
        'address' => 'Supply Street',
    ]);

    Sanctum::actingAs($supplierUser);

    $this->getJson('/api/suppliers')->assertOk();
    $this->getJson('/api/inventories')->assertForbidden();
});

it('allows admin to access approval requests but not pharmacy-owned lookup entities', function () {
    $admin = roleUser('admin');
    Sanctum::actingAs($admin);

    $this->getJson('/api/approval-requests')->assertOk();
    $this->getJson('/api/laboratories')->assertForbidden();
});
