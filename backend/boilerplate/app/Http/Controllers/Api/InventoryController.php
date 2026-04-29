<?php

namespace App\Http\Controllers\Api;

use App\Models\Inventory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::query()->with(['pharmacy', 'medication']);

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

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pharmacy_id' => ['nullable', 'integer', 'exists:pharmacies,id'],
            'medication_id' => ['required', 'integer', 'exists:medications,id'],
            'qte' => ['required', 'integer', 'min:0'],
            'prix_achat' => ['required', 'numeric', 'min:0'],
            'prix_vente' => ['required', 'numeric', 'min:0'],
        ]);

        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacy = $request->user()->pharmacy;
            if (! $pharmacy) {
                return response()->json(['message' => 'Pharmacy profile is required.'], 422);
            }
            $validated['pharmacy_id'] = $pharmacy->id;
        }

        $inventory = Inventory::updateOrCreate(
            [
                'pharmacy_id' => $validated['pharmacy_id'],
                'medication_id' => $validated['medication_id'],
            ],
            [
                'qte' => $validated['qte'],
                'prix_achat' => $validated['prix_achat'],
                'prix_vente' => $validated['prix_vente'],
            ]
        );
        broadcast(new \App\Events\InventoryUpdated($inventory))->toOthers();

        return response()->json($inventory->load(['pharmacy', 'medication']), 201);
    }

    public function show(Request $request, Inventory $inventory)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($inventory->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($inventory->load(['pharmacy', 'medication']));
    }

    public function update(Request $request, Inventory $inventory)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($inventory->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'qte' => ['sometimes', 'integer', 'min:0'],
            'prix_achat' => ['sometimes', 'numeric', 'min:0'],
            'prix_vente' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $inventory->update($validated);
        broadcast(new \App\Events\InventoryUpdated($inventory->fresh()))->toOthers();

        return response()->json($inventory->fresh()->load(['pharmacy', 'medication']));
    }

    public function destroy(Request $request, Inventory $inventory)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($inventory->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $inventory->delete();

        return response()->json([], 204);
    }
}
