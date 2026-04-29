<?php

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

function adminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

it('lets an admin list users and filter by role and text', function () {
    $admin = adminUser();
    Sanctum::actingAs($admin);

    $pharmacyAdmin = User::factory()->create([
        'name' => 'Pharmacy Owner',
        'email' => 'pharmacy-owner@example.com',
        'phone_number' => '+212600000010',
    ]);
    $pharmacyAdmin->assignRole('pharmacy_admin');

    $supplierAdmin = User::factory()->create([
        'name' => 'Supplier Owner',
        'email' => 'supplier-owner@example.com',
        'phone_number' => '+212600000011',
    ]);
    $supplierAdmin->assignRole('supplier_admin');

    $response = $this->getJson('/api/users?role=pharmacy_admin&q=Pharmacy');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.email'))->toBe('pharmacy-owner@example.com');
});

it('lets an admin create update and delete users', function () {
    Sanctum::actingAs(adminUser());

    $create = $this->postJson('/api/users', [
        'name' => 'New Pharmacy Admin',
        'email' => 'new-pharmacy@example.com',
        'phone_number' => '+212600000012',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'pharmacy_admin',
    ]);

    $create->assertCreated();
    $userId = $create->json('id');

    $createdUser = User::findOrFail($userId);
    expect($createdUser->hasRole('pharmacy_admin'))->toBeTrue();

    $update = $this->patchJson('/api/users/'.$userId, [
        'name' => 'Updated Pharmacy Admin',
        'role' => 'supplier_admin',
    ]);

    $update->assertOk();
    expect($createdUser->fresh()->name)->toBe('Updated Pharmacy Admin');
    expect($createdUser->fresh()->hasRole('supplier_admin'))->toBeTrue();

    $this->deleteJson('/api/users/'.$userId)->assertNoContent();
    expect(User::whereKey($userId)->exists())->toBeFalse();
});

it('blocks non-admin users from user management routes', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    Sanctum::actingAs($user);

    $this->getJson('/api/users')->assertForbidden();
});
