<?php

namespace App\Http\Controllers\Api;

use App\Models\Medication;
use App\Models\ActiveIngredient;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MedicationActiveIngredientController extends Controller
{
    private function canAccessMedication(Medication $medication): bool
    {
        $user = request()->user();

        return $user && ($user->hasRole('admin') || $medication->created_by === $user->id);
    }

    public function index(Medication $medication)
    {
        if (! $this->canAccessMedication($medication)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(
            $medication->activeIngredients()
                ->paginate(15)
        );
    }

    public function store(Request $request, Medication $medication)
    {
        if (! $this->canAccessMedication($medication)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'active_ingredient_id' => ['required', 'integer', 'exists:active_ingredients,id'],
            'strength' => ['nullable', 'string', 'max:255'],
        ]);

        $medication->activeIngredients()->syncWithoutDetaching([
            $validated['active_ingredient_id'] => ['strength' => $validated['strength'] ?? null],
        ]);

        return response()->json($medication->load('activeIngredients'));
    }

    public function show(Medication $medication, ActiveIngredient $activeIngredient)
    {
        if (! $this->canAccessMedication($medication)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $attached = $medication->activeIngredients()
            ->where('active_ingredients.id', $activeIngredient->id)
            ->first();

        if (! $attached) {
            return response()->json(['message' => 'Active ingredient not attached to medication.'], 404);
        }

        return response()->json($attached);
    }

    public function update(Request $request, Medication $medication, ActiveIngredient $activeIngredient)
    {
        if (! $this->canAccessMedication($medication)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'strength' => ['nullable', 'string', 'max:255'],
        ]);

        $exists = $medication->activeIngredients()
            ->where('active_ingredients.id', $activeIngredient->id)
            ->exists();

        if (! $exists) {
            return response()->json(['message' => 'Active ingredient not attached to medication.'], 404);
        }

        $medication->activeIngredients()->updateExistingPivot(
            $activeIngredient->id,
            ['strength' => $validated['strength'] ?? null]
        );

        return response()->json($medication->load('activeIngredients'));
    }

    public function destroy(Medication $medication, ActiveIngredient $activeIngredient)
    {
        if (! $this->canAccessMedication($medication)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $medication->activeIngredients()->detach($activeIngredient->id);

        return response()->json([], 204);
    }
}
