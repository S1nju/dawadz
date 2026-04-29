<?php

use App\Models\ApprovalRequest;
use App\Models\Pharmacy;
use App\Models\Supplier;
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

it('registers a user and assigns the user role', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Jane User',
        'email' => 'jane@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['token', 'token_type', 'user']);

    expect(User::where('email', 'jane@example.com')->first())
        ->not->toBeNull();

    expect(User::where('email', 'jane@example.com')->first()->hasRole('user'))
        ->toBeTrue();
});

it('logs in an existing user', function () {
    User::factory()->create([
        'email' => 'login@example.com',
        'password' => Hash::make('password123'),
    ])->assignRole('user');

    $response = $this->postJson('/api/auth/login', [
        'email' => 'login@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'token_type', 'user']);
});

it('lets an authenticated user create an approval request and only see their own requests', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $otherUser = User::factory()->create();
    $otherUser->assignRole('user');

    ApprovalRequest::create([
        'user_id' => $otherUser->id,
        'type' => 'supplier',
        'status' => 'pending',
        'documents' => ['existing.pdf'],
        'images' => ['existing.png'],
    ]);

    Sanctum::actingAs($user);

    $createResponse = $this->postJson('/api/approval-requests', [
        'type' => 'supplier',
        'documents' => ['national-id.pdf'],
        'images' => ['shop.png'],
    ]);

    $createResponse->assertCreated();

    $listResponse = $this->getJson('/api/approval-requests');

    $listResponse->assertOk();
    expect($listResponse->json('data'))->toHaveCount(1);
    expect($listResponse->json('data.0.user_id'))->toBe($user->id);
});

it('lets an admin accept a supplier request without auto-creating supplier profile', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $user = User::factory()->create();
    $user->assignRole('user');

    $approvalRequest = ApprovalRequest::create([
        'user_id' => $user->id,
        'type' => 'supplier',
        'status' => 'pending',
        'documents' => ['company-registry.pdf'],
        'images' => ['warehouse.png'],
    ]);

    Sanctum::actingAs($admin);

    $response = $this->patchJson("/api/approval-requests/{$approvalRequest->id}/status", [
        'status' => 'accepted',
    ]);

    $response->assertOk();

    expect($approvalRequest->fresh()->status)->toBe('accepted');
    expect($approvalRequest->fresh()->reviewed_by)->toBe($admin->id);
    expect(Supplier::where('user_id', $user->id)->exists())->toBeFalse();
    expect($user->fresh()->hasRole('supplier_admin'))->toBeTrue();
});

it('lets an admin accept a pharmacy request without auto-creating pharmacy profile', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $user = User::factory()->create();
    $user->assignRole('user');

    $approvalRequest = ApprovalRequest::create([
        'user_id' => $user->id,
        'type' => 'pharmacy',
        'status' => 'pending',
        'documents' => ['license.pdf'],
        'images' => ['storefront.png'],
    ]);

    Sanctum::actingAs($admin);

    $response = $this->patchJson("/api/approval-requests/{$approvalRequest->id}/status", [
        'status' => 'accepted',
    ]);

    $response->assertOk();

    expect($approvalRequest->fresh()->status)->toBe('accepted');
    expect(Pharmacy::where('owner_id', $user->id)->exists())->toBeFalse();
    expect($user->fresh()->hasRole('pharmacy_admin'))->toBeTrue();
});
