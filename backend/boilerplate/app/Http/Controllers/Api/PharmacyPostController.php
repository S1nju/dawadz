<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\PharmacyPost;
use Illuminate\Http\Request;

class PharmacyPostController extends Controller
{
    public function index(Request $request)
    {
        $query = PharmacyPost::query()->with(['pharmacy.owner', 'medication']);

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            $query->where('pharmacy_id', $pharmacyId ?? 0);
        }

        if ($request->filled('pharmacy_id')) {
            $query->where('pharmacy_id', (int) $request->input('pharmacy_id'));
        }

        if ($request->filled('medication_id')) {
            $query->where('medication_id', (int) $request->input('medication_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->string('search') . '%';
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', $search)
                    ->orWhere('description', 'like', $search)
                    ->orWhereHas('medication', function ($medicationQuery) use ($search) {
                        $medicationQuery->where('name', 'like', $search)
                            ->orWhere('commercial_name', 'like', $search);
                    });
            });
        }

        return response()->json($query->latest()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pharmacy_id' => ['nullable', 'integer', 'exists:pharmacies,id'],
            'medication_id' => ['required', 'integer', 'exists:medications,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'qte_vente' => ['required', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacy = $request->user()->pharmacy;
            if (! $pharmacy) {
                return response()->json(['message' => 'Pharmacy profile is required.'], 422);
            }
            $validated['pharmacy_id'] = $pharmacy->id;
        }

        $inventory = Inventory::query()
            ->where('pharmacy_id', $validated['pharmacy_id'])
            ->where('medication_id', $validated['medication_id'])
            ->first();

        if (! $inventory) {
            return response()->json(['message' => 'Medication must exist in pharmacy inventory before posting.'], 422);
        }

        if ((int) $validated['qte_vente'] > (int) $inventory->qte) {
            return response()->json(['message' => 'qte_vente cannot exceed available inventory quantity.'], 422);
        }

        if (! array_key_exists('unit_price', $validated) || $validated['unit_price'] === null) {
            $validated['unit_price'] = $inventory->prix_vente;
        }

        return response()->json(PharmacyPost::create($validated)->load(['pharmacy', 'medication']), 201);
    }

    public function show(Request $request, PharmacyPost $pharmacyPost)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($pharmacyPost->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($pharmacyPost->load(['pharmacy.owner', 'medication']));
    }

    public function update(Request $request, PharmacyPost $pharmacyPost)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($pharmacyPost->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'medication_id' => ['sometimes', 'integer', 'exists:medications,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'qte_vente' => ['sometimes', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $nextMedicationId = (int) ($validated['medication_id'] ?? $pharmacyPost->medication_id);
        $nextQteVente = (int) ($validated['qte_vente'] ?? $pharmacyPost->qte_vente);

        $inventory = Inventory::query()
            ->where('pharmacy_id', $pharmacyPost->pharmacy_id)
            ->where('medication_id', $nextMedicationId)
            ->first();

        if (! $inventory) {
            return response()->json(['message' => 'Medication must exist in pharmacy inventory before posting.'], 422);
        }

        if ($nextQteVente > (int) $inventory->qte) {
            return response()->json(['message' => 'qte_vente cannot exceed available inventory quantity.'], 422);
        }

        if (array_key_exists('unit_price', $validated) && $validated['unit_price'] === null) {
            $validated['unit_price'] = $inventory->prix_vente;
        }

        $pharmacyPost->update($validated);

        return response()->json($pharmacyPost->fresh()->load(['pharmacy', 'medication']));
    }

    public function destroy(Request $request, PharmacyPost $pharmacyPost)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($pharmacyPost->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $pharmacyPost->delete();

        return response()->json([], 204);
    }
}
