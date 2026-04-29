<?php

namespace App\Http\Controllers\Api;

use App\Models\PharmaceuticalForm;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PharmaceuticalFormController extends Controller
{
    public function index(Request $request)
    {
        $query = PharmaceuticalForm::query()->where('created_by', $request->user()->id);

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
                Rule::unique('pharmaceutical_forms', 'name')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
        ]);

        $validated['created_by'] = $userId;

        return response()->json(PharmaceuticalForm::create($validated), 201);
    }

    public function show(Request $request, PharmaceuticalForm $pharmaceuticalForm)
    {
        $this->authorizeOwner($request, $pharmaceuticalForm->created_by);

        return response()->json($pharmaceuticalForm);
    }

    public function update(Request $request, PharmaceuticalForm $pharmaceuticalForm)
    {
        $this->authorizeOwner($request, $pharmaceuticalForm->created_by);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('pharmaceutical_forms', 'name')
                    ->ignore($pharmaceuticalForm->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
        ]);

        $pharmaceuticalForm->update($validated);

        return response()->json($pharmaceuticalForm);
    }

    public function destroy(Request $request, PharmaceuticalForm $pharmaceuticalForm)
    {
        $this->authorizeOwner($request, $pharmaceuticalForm->created_by);

        $pharmaceuticalForm->delete();

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, ?int $ownerId): void
    {
        abort_if($ownerId !== $request->user()->id, 403, 'You can only access your own lookup entries.');
    }
}
