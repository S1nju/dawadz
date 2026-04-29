<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('inventory', function ($user) {
    return true;
});

Broadcast::channel('medication-requests', function ($user) {
    return true;
});

Broadcast::channel('medication-requests.{city}', function ($user, $city) {
    return true;
});

Broadcast::channel('pharmacy-requests.{city}', function ($user, $city) {
    return true;
});

Broadcast::channel('user-notifications.{requestId}', function ($user, $requestId) {
    return true;
});
