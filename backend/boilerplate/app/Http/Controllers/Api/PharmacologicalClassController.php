<?php

namespace App\Http\Controllers\Api;

use App\Models\PharmacologicalClass;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PharmacologicalClassController extends Controller
{
    public function index(Request $request)
    {
        $query = PharmacologicalClass::query()->where('created_by', $request->user()->id);

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q').'%');
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pharmacological_classes', 'name')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $userId;

        return response()->json(PharmacologicalClass::create($validated), 201);
    }

    public function show(Request $request, PharmacologicalClass $pharmacologicalClass)
    {
        $this->authorizeOwner($request, $pharmacologicalClass->created_by);

        return response()->json($pharmacologicalClass);
    }

    public function update(Request $request, PharmacologicalClass $pharmacologicalClass)
    {
        $this->authorizeOwner($request, $pharmacologicalClass->created_by);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('pharmacological_classes', 'name')
                    ->ignore($pharmacologicalClass->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $pharmacologicalClass->update($validated);

        return response()->json($pharmacologicalClass);
    }

    public function destroy(Request $request, PharmacologicalClass $pharmacologicalClass)
    {
        $this->authorizeOwner($request, $pharmacologicalClass->created_by);

        $pharmacologicalClass->delete();

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, ?int $ownerId): void
    {
        abort_if($ownerId !== $request->user()->id, 403, 'You can only access your own lookup entries.');
    }
}
