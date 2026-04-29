<?php

namespace App\Http\Controllers\Api;

use App\Models\Facture;
use App\Models\FactureLine;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FactureLineController extends Controller
{
    public function index(Request $request, Facture $facture)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($facture->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($facture->lines()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request, Facture $facture)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($facture->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $validated = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'medication_name' => ['required', 'string', 'max:255'],
            'qte' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'total' => ['nullable', 'numeric', 'min:0'],
        ]);

        $line = FactureLine::create([
            'facture_id' => $facture->id,
            'product_id' => $validated['product_id'] ?? null,
            'medication_name' => $validated['medication_name'],
            'qte' => $validated['qte'],
            'unit_price' => $validated['unit_price'],
            'total' => $validated['total'] ?? ($validated['qte'] * $validated['unit_price']),
        ]);

        return response()->json($line, 201);
    }

    public function show(Facture $facture, FactureLine $factureLine)
    {
        if ($factureLine->facture_id !== $facture->id) {
            return response()->json(['message' => 'Line not found for this facture.'], 404);
        }

        return response()->json($factureLine);
    }

    public function update(Request $request, Facture $facture, FactureLine $factureLine)
    {
        if ($factureLine->facture_id !== $facture->id) {
            return response()->json(['message' => 'Line not found for this facture.'], 404);
        }

        $validated = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'medication_name' => ['sometimes', 'string', 'max:255'],
            'qte' => ['sometimes', 'integer', 'min:1'],
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'total' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! array_key_exists('total', $validated) && (isset($validated['qte']) || isset($validated['unit_price']))) {
            $qte = $validated['qte'] ?? $factureLine->qte;
            $unitPrice = $validated['unit_price'] ?? $factureLine->unit_price;
            $validated['total'] = $qte * $unitPrice;
        }

        $factureLine->update($validated);

        return response()->json($factureLine);
    }

    public function destroy(Facture $facture, FactureLine $factureLine)
    {
        if ($factureLine->facture_id !== $facture->id) {
            return response()->json(['message' => 'Line not found for this facture.'], 404);
        }

        $factureLine->delete();

        return response()->json([], 204);
    }
}
