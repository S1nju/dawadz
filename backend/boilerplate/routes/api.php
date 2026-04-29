<?php

use App\Http\Controllers\Api\ActiveIngredientController;
use App\Http\Controllers\Api\ApprovalRequestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommandeController;
use App\Http\Controllers\Api\CountryController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\LaboratoryController;
use App\Http\Controllers\Api\MedicationActiveIngredientController;
use App\Http\Controllers\Api\MedicationController;
use App\Http\Controllers\Api\PharmaceuticalFormController;
use App\Http\Controllers\Api\PharmacologicalClassController;
use App\Http\Controllers\Api\PharmacyController;
use App\Http\Controllers\Api\PharmacyPostController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierPostController;
use App\Http\Controllers\Api\TherapeuticClassController;
use App\Http\Controllers\Api\UserNotificationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\MedicationRequestController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'API is working']);
});

/*
|--------------------------------------------------------------------------
| Public Auth
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/files/{path}', [AuthController::class, 'file'])->where('path', '.*');

/*
|--------------------------------------------------------------------------
| Public Read APIs (search/discovery)
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:public-search')->group(function () {
    Route::get('/pharmacies/nearby', [PharmacyController::class, 'nearby']);
    Route::apiResource('pharmacies', PharmacyController::class)->only(['index', 'show']);
});

/*
|--------------------------------------------------------------------------
| Protected APIs
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Authenticated account management
    Route::prefix('auth')->middleware('throttle:api-write')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/avatar', [AuthController::class, 'updateAvatar']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Approval requests: any authenticated user can request, admin reviews
    Route::middleware('throttle:api-write')->group(function () {
        Route::apiResource('approval-requests', ApprovalRequestController::class)
            ->only(['index', 'store', 'show', 'update']);
    });

    // Notification resource
    Route::middleware('throttle:api-write')->group(function () {
        Route::apiResource('notifications', UserNotificationController::class)->only(['index', 'show', 'destroy']);
        Route::patch('notifications/{notification}/read', [UserNotificationController::class, 'markAsRead']);
    });

    // Admin visibility over platform entities
    Route::middleware(['role:admin', 'throttle:api-write'])->group(function () {
        Route::apiResource('users', UserController::class);
        Route::patch('approval-requests/{approval_request}/status', [ApprovalRequestController::class, 'updateStatus']);
        Route::delete('approval-requests/{approval_request}', [ApprovalRequestController::class, 'destroy']);
    });

    // Pharmacy and supplier owners curate lookup catalogs and only manage their own records
    Route::middleware(['role:pharmacy_admin|pharmacy|supplier_admin|supplier', 'throttle:api-write'])->group(function () {
        Route::apiResource('laboratories', LaboratoryController::class);
        Route::apiResource('therapeutic-classes', TherapeuticClassController::class);
        Route::apiResource('pharmacological-classes', PharmacologicalClassController::class);
        Route::apiResource('active-ingredients', ActiveIngredientController::class);
        Route::apiResource('pharmaceutical-forms', PharmaceuticalFormController::class);
        Route::apiResource('countries', CountryController::class);
    });

    // Supplier profile + stock publishing
    Route::middleware(['role:admin|pharmacy_admin|supplier_admin', 'throttle:api'])->group(function () {
        Route::apiResource('suppliers', SupplierController::class)->only(['index', 'show']);
    });

    Route::middleware(['role:admin|supplier_admin|supplier', 'throttle:api-write'])->group(function () {
        Route::apiResource('suppliers', SupplierController::class)->except(['index', 'show']);
        Route::apiResource('products', ProductController::class);
        Route::apiResource('supplier-posts', SupplierPostController::class)->except(['index', 'show']);
    });

    // Pharmacy owner operations
    Route::middleware(['role:admin|pharmacy_admin|pharmacy', 'throttle:api-write'])->group(function () {
        Route::apiResource('pharmacies', PharmacyController::class)->except(['index', 'show']);
        Route::apiResource('inventories', InventoryController::class);
        Route::apiResource('pharmacy-posts', PharmacyPostController::class);
        Route::apiResource('commandes', CommandeController::class)->except(['index', 'show']);
        Route::apiResource('factures', FactureController::class);
    });

    // Commandes are readable by supplier admins, but writes stay pharmacy/admin-scoped
    Route::middleware(['role:admin|pharmacy_admin|supplier_admin|supplier', 'throttle:api'])->group(function () {
        Route::apiResource('commandes', CommandeController::class)->only(['index', 'show']);
    });

    // Supplier marketplace feed is readable by pharmacy owners, while supplier owners remain scoped in controller
    Route::middleware(['role:admin|pharmacy_admin|supplier_admin', 'throttle:api'])->group(function () {
        Route::apiResource('supplier-posts', SupplierPostController::class)->only(['index', 'show']);
    });

    // Medication reads are owner-scoped for authenticated medication managers
    Route::middleware(['role:admin|pharmacy_admin|supplier_admin', 'throttle:api'])->group(function () {
        Route::apiResource('medications', MedicationController::class)->only(['index', 'show']);
    });

    // Medication write actions are restricted (users are read-only)
    Route::middleware(['role:admin|pharmacy_admin|supplier_admin', 'throttle:api-write'])->group(function () {
        Route::apiResource('medications', MedicationController::class)->except(['index', 'show']);
        Route::apiResource('medications.active-ingredients', MedicationActiveIngredientController::class)
            ->parameters(['active-ingredients' => 'active_ingredient']);
    });

    // Commande confirmation by supplier/admin side
    Route::middleware(['role:admin|supplier_admin|supplier', 'throttle:api-write'])->group(function () {
        Route::patch('commandes/{commande}/confirm', [CommandeController::class, 'confirm']);
        Route::patch('commandes/{commande}/refuse', [CommandeController::class, 'refuse']);
    });

    Route::post('medication-requests', [MedicationRequestController::class, 'sendRequest']);
    Route::post('medication-requests/cancel', [MedicationRequestController::class, 'cancelRequest']);
    Route::post('accepte-request', [MedicationRequestController::class, 'acceptRequest']);
   
});
