<?php

namespace App\Http\Controllers\Api;

use App\Models\TherapeuticClass;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TherapeuticClassController extends Controller
{
    public function index(Request $request)
    {
        $query = TherapeuticClass::query()->where('created_by', $request->user()->id);

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
                Rule::unique('therapeutic_classes', 'name')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $userId;

        return response()->json(TherapeuticClass::create($validated), 201);
    }

    public function show(Request $request, TherapeuticClass $therapeuticClass)
    {
        $this->authorizeOwner($request, $therapeuticClass->created_by);

        return response()->json($therapeuticClass);
    }

    public function update(Request $request, TherapeuticClass $therapeuticClass)
    {
        $this->authorizeOwner($request, $therapeuticClass->created_by);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('therapeutic_classes', 'name')
                    ->ignore($therapeuticClass->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $therapeuticClass->update($validated);

        return response()->json($therapeuticClass);
    }

    public function destroy(Request $request, TherapeuticClass $therapeuticClass)
    {
        $this->authorizeOwner($request, $therapeuticClass->created_by);

        $therapeuticClass->delete();

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, ?int $ownerId): void
    {
        abort_if($ownerId !== $request->user()->id, 403, 'You can only access your own lookup entries.');
    }
}
