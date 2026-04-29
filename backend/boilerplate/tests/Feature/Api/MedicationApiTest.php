<?php

use App\Models\ActiveIngredient;
use App\Models\Country;
use App\Models\Laboratory;
use App\Models\Medication;
use App\Models\PharmaceuticalForm;
use App\Models\TherapeuticClass;
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

function medicationOwner(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function medicationFixtures(User $user, string $suffix = ''): array
{
    $laboratory = Laboratory::create(['name' => 'Med Lab'.$suffix, 'country' => 'MA']);
    $country = Country::create(['name' => 'Morocco'.$suffix, 'code' => 'M'.substr(strtoupper(md5($suffix ?: 'default')), 0, 2)]);
    $form = PharmaceuticalForm::create(['name' => 'Tablet'.$suffix]);
    $therapeuticClass = TherapeuticClass::create(['name' => 'Pain relief'.$suffix, 'description' => '']);
    $ingredient = ActiveIngredient::create(['dci' => 'Paracetamol'.$suffix, 'dci_code' => 'N02BE'.substr(strtoupper(md5($suffix ?: 'default')), 0, 2)]);

    $medication = Medication::create([
        'name' => 'Paracetamol'.$suffix,
        'commercial_name' => 'Doliprane'.$suffix,
        'laboratory_id' => $laboratory->id,
        'therapeutic_class_id' => $therapeuticClass->id,
        'pharmaceutical_form_id' => $form->id,
        'country_id' => $country->id,
        'dosage' => '500mg',
        'conditioning' => 'Box of 10',
        'type' => 'brand',
        'list' => 'free',
        'marketed' => true,
        'reimbursable' => true,
        'registration_num' => 'REG-1000'.($suffix ?: ''),
        'notice_link' => 'https://example.com/notice.pdf',
        'img_link' => 'https://example.com/img.png',
        'created_by' => $user->id,
    ]);

    $medication->activeIngredients()->attach($ingredient->id, ['strength' => '500mg']);

    return [$medication, $ingredient];
}

it('lets an authenticated owner create, update, and delete medications', function () {
    $user = medicationOwner('supplier_admin');
    Sanctum::actingAs($user);

    $laboratory = Laboratory::create(['name' => 'Owner Lab', 'country' => 'MA']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $form = PharmaceuticalForm::create(['name' => 'Capsule']);

    $response = $this->postJson('/api/medications', [
        'name' => 'Amoxicillin',
        'commercial_name' => 'Amox',
        'laboratory_id' => $laboratory->id,
        'pharmaceutical_form_id' => $form->id,
        'country_id' => $country->id,
        'type' => 'generic',
        'list' => 'free',
    ]);

    $response->assertCreated();
    $medicationId = $response->json('id');

    $this->patchJson('/api/medications/'.$medicationId, [
        'commercial_name' => 'Amox Updated',
    ])->assertOk();

    $this->deleteJson('/api/medications/'.$medicationId)->assertNoContent();
});

it('lets medication owners read only their own medication records', function () {
    $owner = medicationOwner('supplier_admin');
    $otherOwner = medicationOwner('pharmacy_admin');
    Sanctum::actingAs($owner);

    [$ownedMedication] = medicationFixtures($owner, '-owner');
    [$foreignMedication] = medicationFixtures($otherOwner, '-foreign');

    $response = $this->getJson('/api/medications');

    $response->assertOk();
    expect(collect($response->json('data'))->pluck('id')->all())->toContain($ownedMedication->id);
    expect(collect($response->json('data'))->pluck('id')->all())->not->toContain($foreignMedication->id);

    $this->getJson('/api/medications/'.$ownedMedication->id)->assertOk();
    $this->getJson('/api/medications/'.$foreignMedication->id)->assertForbidden();
});

it('blocks nested medication ingredient routes for foreign owners', function () {
    $owner = medicationOwner('supplier_admin');
    $otherOwner = medicationOwner('pharmacy_admin');
    Sanctum::actingAs($owner);

    [$foreignMedication] = medicationFixtures($otherOwner, '-foreign-nested');
    $ingredient = ActiveIngredient::create(['dci' => 'Ibuprofen', 'dci_code' => 'M01AE01']);

    $this->getJson('/api/medications/'.$foreignMedication->id.'/active-ingredients')->assertForbidden();
    $this->postJson('/api/medications/'.$foreignMedication->id.'/active-ingredients', [
        'active_ingredient_id' => $ingredient->id,
        'strength' => '200mg',
    ])->assertForbidden();
});

it('blocks medication reads for non-medication users', function () {
    $user = medicationOwner('user');
    Sanctum::actingAs($user);

    $this->getJson('/api/medications')->assertForbidden();
    $this->postJson('/api/medications', [
        'name' => 'Forbidden',
        'laboratory_id' => 1,
        'pharmaceutical_form_id' => 1,
        'type' => 'generic',
        'list' => 'free',
    ])->assertForbidden();
});

it('manages medication active ingredients through nested routes', function () {
    $user = medicationOwner('supplier_admin');
    Sanctum::actingAs($user);

    $laboratory = Laboratory::create(['name' => 'Nested Lab', 'country' => 'MA']);
    $country = Country::create(['name' => 'Morocco', 'code' => 'MAR']);
    $form = PharmaceuticalForm::create(['name' => 'Syrup']);
    $medication = Medication::create([
        'name' => 'Cough Syrup',
        'commercial_name' => 'Syrup X',
        'laboratory_id' => $laboratory->id,
        'pharmaceutical_form_id' => $form->id,
        'country_id' => $country->id,
        'type' => 'brand',
        'list' => 'free',
        'created_by' => $user->id,
    ]);

    $ingredient = ActiveIngredient::create(['dci' => 'Guaifenesin', 'dci_code' => 'R05CA03']);

    $this->postJson("/api/medications/{$medication->id}/active-ingredients", [
        'active_ingredient_id' => $ingredient->id,
        'strength' => '100mg',
    ])->assertOk();

    $this->patchJson("/api/medications/{$medication->id}/active-ingredients/{$ingredient->id}", [
        'strength' => '200mg',
    ])->assertOk();

    $this->deleteJson("/api/medications/{$medication->id}/active-ingredients/{$ingredient->id}")->assertNoContent();
});
