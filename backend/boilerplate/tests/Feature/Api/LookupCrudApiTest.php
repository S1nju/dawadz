<?php

use App\Models\ActiveIngredient;
use App\Models\Country;
use App\Models\Laboratory;
use App\Models\PharmaceuticalForm;
use App\Models\PharmacologicalClass;
use App\Models\TherapeuticClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['user', 'admin', 'pharmacy_admin', 'supplier_admin'] as $role) {
        Role::findOrCreate($role);
    }
});

function pharmacyAdminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('pharmacy_admin');

    return $user;
}

function supplierAdminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('supplier_admin');

    return $user;
}

it('supports CRUD for laboratories', function () {
    Sanctum::actingAs(pharmacyAdminUser());

    $create = $this->postJson('/api/laboratories', [
        'name' => 'Laboratory One',
        'country' => 'MA',
    ]);

    $create->assertCreated();
    $laboratoryId = $create->json('id');

    $this->getJson('/api/laboratories/'.$laboratoryId)->assertOk();
    $this->putJson('/api/laboratories/'.$laboratoryId, [
        'country' => 'TN',
    ])->assertOk();
    $this->deleteJson('/api/laboratories/'.$laboratoryId)->assertNoContent();
});

it('lets supplier admins manage laboratories too', function () {
    Sanctum::actingAs(supplierAdminUser());

    $create = $this->postJson('/api/laboratories', [
        'name' => 'Supplier Lab',
        'country' => 'MA',
    ]);

    $create->assertCreated();
    $laboratoryId = $create->json('id');

    $this->patchJson('/api/laboratories/'.$laboratoryId, [
        'country' => 'TN',
    ])->assertOk();
});

it('supports CRUD for therapeutic classes', function () {
    Sanctum::actingAs(pharmacyAdminUser());

    $create = $this->postJson('/api/therapeutic-classes', [
        'name' => 'Antibiotics',
        'description' => 'Bacterial infections',
    ]);

    $create->assertCreated();
    $id = $create->json('id');

    $this->getJson('/api/therapeutic-classes/'.$id)->assertOk();
    $this->patchJson('/api/therapeutic-classes/'.$id, [
        'description' => 'Updated',
    ])->assertOk();
    $this->deleteJson('/api/therapeutic-classes/'.$id)->assertNoContent();
});

it('supports CRUD for pharmacological classes', function () {
    Sanctum::actingAs(pharmacyAdminUser());

    $create = $this->postJson('/api/pharmacological-classes', [
        'name' => 'Beta blockers',
        'description' => 'Heart medicines',
    ]);

    $create->assertCreated();
    $id = $create->json('id');

    $this->getJson('/api/pharmacological-classes/'.$id)->assertOk();
    $this->patchJson('/api/pharmacological-classes/'.$id, [
        'description' => 'Updated',
    ])->assertOk();
    $this->deleteJson('/api/pharmacological-classes/'.$id)->assertNoContent();
});

it('supports CRUD for active ingredients', function () {
    Sanctum::actingAs(pharmacyAdminUser());

    $create = $this->postJson('/api/active-ingredients', [
        'dci' => 'Paracetamol',
        'dci_code' => 'N02BE01',
    ]);

    $create->assertCreated();
    $id = $create->json('id');

    $this->getJson('/api/active-ingredients/'.$id)->assertOk();
    $this->patchJson('/api/active-ingredients/'.$id, [
        'dci_code' => 'N02BE02',
    ])->assertOk();
    $this->deleteJson('/api/active-ingredients/'.$id)->assertNoContent();
});

it('supports CRUD for pharmaceutical forms', function () {
    Sanctum::actingAs(pharmacyAdminUser());

    $create = $this->postJson('/api/pharmaceutical-forms', [
        'name' => 'Tablet',
    ]);

    $create->assertCreated();
    $id = $create->json('id');

    $this->getJson('/api/pharmaceutical-forms/'.$id)->assertOk();
    $this->patchJson('/api/pharmaceutical-forms/'.$id, [
        'name' => 'Capsule',
    ])->assertOk();
    $this->deleteJson('/api/pharmaceutical-forms/'.$id)->assertNoContent();
});

it('supports CRUD for countries', function () {
    Sanctum::actingAs(pharmacyAdminUser());

    $create = $this->postJson('/api/countries', [
        'name' => 'Morocco',
        'code' => 'MAR',
    ]);

    $create->assertCreated();
    $id = $create->json('id');

    $this->getJson('/api/countries/'.$id)->assertOk();
    $this->patchJson('/api/countries/'.$id, [
        'code' => 'TUN',
    ])->assertOk();
    $this->deleteJson('/api/countries/'.$id)->assertNoContent();
});

it('rejects lookup creation for users without lookup manager roles', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    Sanctum::actingAs($user);

    $this->postJson('/api/laboratories', [
        'name' => 'Forbidden Lab',
        'country' => 'MA',
    ])->assertForbidden();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Sanctum::actingAs($admin);

    $this->postJson('/api/laboratories', [
        'name' => 'Admin Forbidden Lab',
        'country' => 'MA',
    ])->assertForbidden();
});
