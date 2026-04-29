<?php

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['user', 'admin'] as $role) {
        Role::findOrCreate($role);
    }
});

function notificationUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

it('shows and marks only the authenticated user notifications as read', function () {
    $user = notificationUser('user');
    $other = notificationUser('user');

    $notification = UserNotification::create([
        'user_id' => $user->id,
        'type' => 'info',
        'message' => 'Hello',
    ]);

    UserNotification::create([
        'user_id' => $other->id,
        'type' => 'info',
        'message' => 'Other',
    ]);

    Sanctum::actingAs($user);

    $this->getJson('/api/notifications')->assertOk();
    $this->patchJson('/api/notifications/'.$notification->id.'/read')->assertOk();
    expect($notification->fresh()->read_at)->not->toBeNull();
});

it('throttles auth routes after repeated requests', function () {
    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'password123',
        ]);
    }

    $this->postJson('/api/auth/login', [
        'email' => 'missing@example.com',
        'password' => 'password123',
    ])->assertTooManyRequests();
});
