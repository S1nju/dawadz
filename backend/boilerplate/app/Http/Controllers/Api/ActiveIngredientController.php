<?php

namespace App\Http\Controllers\Api;

use App\Models\ActiveIngredient;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ActiveIngredientController extends Controller
{
    public function index(Request $request)
    {
        $query = ActiveIngredient::query()->where('created_by', $request->user()->id);

        if ($request->filled('q')) {
            $search = '%'.$request->string('q').'%';
            $query->where('dci', 'like', $search)
                ->orWhere('dci_code', 'like', $search);
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'dci' => [
                'required',
                'string',
                'max:255',
                Rule::unique('active_ingredients', 'dci')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'dci_code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('active_ingredients', 'dci_code')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
        ]);

        $validated['created_by'] = $userId;

        return response()->json(ActiveIngredient::create($validated), 201);
    }

    public function show(Request $request, ActiveIngredient $activeIngredient)
    {
        $this->authorizeOwner($request, $activeIngredient->created_by);

        return response()->json($activeIngredient);
    }

    public function update(Request $request, ActiveIngredient $activeIngredient)
    {
        $this->authorizeOwner($request, $activeIngredient->created_by);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'dci' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('active_ingredients', 'dci')
                    ->ignore($activeIngredient->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'dci_code' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('active_ingredients', 'dci_code')
                    ->ignore($activeIngredient->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
        ]);

        $activeIngredient->update($validated);

        return response()->json($activeIngredient);
    }

    public function destroy(Request $request, ActiveIngredient $activeIngredient)
    {
        $this->authorizeOwner($request, $activeIngredient->created_by);

        $activeIngredient->delete();

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, ?int $ownerId): void
    {
        abort_if($ownerId !== $request->user()->id, 403, 'You can only access your own lookup entries.');
    }
}
