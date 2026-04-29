<?php

namespace App\Http\Controllers\Api;

use App\Models\Country;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CountryController extends Controller
{
    public function index(Request $request)
    {
        $query = Country::query()->where('created_by', $request->user()->id);

        if ($request->filled('q')) {
            $search = '%'.$request->string('q').'%';
            $query->where('name', 'like', $search)
                ->orWhere('code', 'like', $search);
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
                Rule::unique('countries', 'name')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'code' => [
                'required',
                'string',
                'size:3',
                Rule::unique('countries', 'code')->where(fn ($query) => $query->where('created_by', $userId)),
            ],
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['created_by'] = $userId;

        return response()->json(Country::create($validated), 201);
    }

    public function show(Request $request, Country $country)
    {
        $this->authorizeOwner($request, $country->created_by);

        return response()->json($country);
    }

    public function update(Request $request, Country $country)
    {
        $this->authorizeOwner($request, $country->created_by);

        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('countries', 'name')
                    ->ignore($country->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
            'code' => [
                'sometimes',
                'string',
                'size:3',
                Rule::unique('countries', 'code')
                    ->ignore($country->id)
                    ->where(fn ($query) => $query->where('created_by', $userId)),
            ],
        ]);

        if (array_key_exists('code', $validated)) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $country->update($validated);

        return response()->json($country);
    }

    public function destroy(Request $request, Country $country)
    {
        $this->authorizeOwner($request, $country->created_by);

        $country->delete();

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, ?int $ownerId): void
    {
        abort_if($ownerId !== $request->user()->id, 403, 'You can only access your own lookup entries.');
    }
}
