<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('exposes the expected api route families', function () {
    $routes = collect(app('router')->getRoutes()->getRoutesByName());

    expect($routes->keys()->contains('approval-requests.index'))->toBeTrue();
    expect($routes->keys()->contains('users.index'))->toBeTrue();
    expect($routes->keys()->contains('medications.index'))->toBeTrue();
    expect($routes->keys()->contains('supplier-posts.index'))->toBeTrue();
    expect($routes->keys()->contains('commandes.store'))->toBeTrue();
    expect($routes->keys()->contains('factures.store'))->toBeTrue();
});
