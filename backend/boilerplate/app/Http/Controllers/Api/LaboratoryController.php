<?php

namespace App\Http\Controllers\Api;

use App\Models\Laboratory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LaboratoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Laboratory::query()->where('created_by', $request->user()->id);

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
                Rule::unique('laboratories', 'name')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'country' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['created_by'] = $userId;

        return response()->json(Laboratory::create($validated), 201);
    }

    public function show(Request $request, Laboratory $laboratory)
    {
        $this->authorizeOwner($request, $laboratory->created_by);

        return response()->json($laboratory);
    }

    public function update(Request $request, Laboratory $laboratory)
    {
        $this->authorizeOwner($request, $laboratory->created_by);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('laboratories', 'name')
                    ->ignore($laboratory->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'country' => ['nullable', 'string', 'max:255'],
        ]);

        $laboratory->update($validated);

        return response()->json($laboratory);
    }

    public function destroy(Request $request, Laboratory $laboratory)
    {
        $this->authorizeOwner($request, $laboratory->created_by);

        $laboratory->delete();

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, ?int $ownerId): void
    {
        abort_if($ownerId !== $request->user()->id, 403, 'You can only access your own lookup entries.');
    }
}
