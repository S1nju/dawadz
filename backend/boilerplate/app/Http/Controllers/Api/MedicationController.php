<?php

namespace App\Http\Controllers\Api;

use App\Models\Medication;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MedicationController extends Controller
{
    public function index(Request $request)
    {
        $query = Medication::query()->with([
            'laboratory',
            'therapeuticClass',
            'pharmacologicalClass',
            'pharmaceuticalForm',
            'country',
            'activeIngredients',
        ]);

        if ($request->filled('q')) {
            $search = '%'.$request->string('q').'%';
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', $search)
                    ->orWhere('commercial_name', 'like', $search)
                    ->orWhere('registration_num', 'like', $search);
            });
        }

        if ($request->filled('laboratory_id')) {
            $query->where('laboratory_id', (int) $request->input('laboratory_id'));
        }

        if ($request->filled('therapeutic_class_id')) {
            $query->where('therapeutic_class_id', (int) $request->input('therapeutic_class_id'));
        }

        if ($request->user() && ! $request->user()->hasRole('admin')) {
            $query->where('created_by', $request->user()->id);
        }

        if ($request->boolean('mine') && $request->user()) {
            $query->where('created_by', $request->user()->id);
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'commercial_name' => ['nullable', 'string', 'max:255'],
            'laboratory_id' => ['required', 'integer', 'exists:laboratories,id'],
            'therapeutic_class_id' => ['nullable', 'integer', 'exists:therapeutic_classes,id'],
            'pharmacological_class_id' => ['nullable', 'integer', 'exists:pharmacological_classes,id'],
            'pharmaceutical_form_id' => ['required', 'integer', 'exists:pharmaceutical_forms,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'dosage' => ['nullable', 'string', 'max:255'],
            'conditioning' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:generic,brand,biosimilar,herbal'],
            'list' => ['required', 'in:list_i,list_ii,list_iii,free'],
            'marketed' => ['boolean'],
            'reimbursable' => ['boolean'],
            'registration_num' => ['nullable', 'string', 'max:255', 'unique:medications,registration_num'],
            'notice_link' => ['nullable', 'url', 'max:2048'],
            'img_link' => ['nullable', 'url', 'max:2048'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $medication = Medication::create($validated);

        return response()->json($medication->load(['laboratory', 'activeIngredients']), 201);
    }

    public function show(Medication $medication)
    {
        $user = request()->user();

        if ($user && ! $user->hasRole('admin') && $medication->created_by !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($medication->load([
            'laboratory',
            'therapeuticClass',
            'pharmacologicalClass',
            'pharmaceuticalForm',
            'country',
            'activeIngredients',
        ]));
    }

    public function update(Request $request, Medication $medication)
    {
        if (! $request->user()->hasRole('admin') && $medication->created_by !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'commercial_name' => ['nullable', 'string', 'max:255'],
            'laboratory_id' => ['sometimes', 'integer', 'exists:laboratories,id'],
            'therapeutic_class_id' => ['nullable', 'integer', 'exists:therapeutic_classes,id'],
            'pharmacological_class_id' => ['nullable', 'integer', 'exists:pharmacological_classes,id'],
            'pharmaceutical_form_id' => ['sometimes', 'integer', 'exists:pharmaceutical_forms,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'dosage' => ['nullable', 'string', 'max:255'],
            'conditioning' => ['nullable', 'string', 'max:255'],
            'type' => ['sometimes', 'in:generic,brand,biosimilar,herbal'],
            'list' => ['sometimes', 'in:list_i,list_ii,list_iii,free'],
            'marketed' => ['boolean'],
            'reimbursable' => ['boolean'],
            'registration_num' => ['nullable', 'string', 'max:255', 'unique:medications,registration_num,'.$medication->id],
            'notice_link' => ['nullable', 'url', 'max:2048'],
            'img_link' => ['nullable', 'url', 'max:2048'],
        ]);

        $medication->update($validated);

        return response()->json($medication->fresh()->load(['laboratory', 'activeIngredients']));
    }

    public function destroy(Request $request, Medication $medication)
    {
        if (! $request->user()->hasRole('admin') && $medication->created_by !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $medication->delete();

        return response()->json([], 204);
    }
}
