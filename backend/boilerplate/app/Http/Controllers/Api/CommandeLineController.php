<?php

namespace App\Http\Controllers\Api;

use App\Models\Commande;
use App\Models\CommandeLine;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CommandeLineController extends Controller
{
    public function index(Request $request, Commande $commande)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($commande->pharmacy_id !== $pharmacyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return response()->json($commande->lines()->paginate((int) $request->input('per_page', 15)));
    }

    public function store(Request $request, Commande $commande)
    {
        if ($request->user()->hasRole('pharmacy_admin') && ! $request->user()->hasRole('admin')) {
            $pharmacyId = $request->user()->pharmacy?->id;
            if ($commande->pharmacy_id !== $pharmacyId) {
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

        $line = CommandeLine::create([
            'commande_id' => $commande->id,
            'product_id' => $validated['product_id'] ?? null,
            'medication_name' => $validated['medication_name'],
            'qte' => $validated['qte'],
            'unit_price' => $validated['unit_price'],
            'total' => $validated['total'] ?? ($validated['qte'] * $validated['unit_price']),
        ]);

        return response()->json($line, 201);
    }

    public function show(Commande $commande, CommandeLine $commandeLine)
    {
        if ($commandeLine->commande_id !== $commande->id) {
            return response()->json(['message' => 'Line not found for this commande.'], 404);
        }

        return response()->json($commandeLine);
    }

    public function update(Request $request, Commande $commande, CommandeLine $commandeLine)
    {
        if ($commandeLine->commande_id !== $commande->id) {
            return response()->json(['message' => 'Line not found for this commande.'], 404);
        }

        $validated = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'medication_name' => ['sometimes', 'string', 'max:255'],
            'qte' => ['sometimes', 'integer', 'min:1'],
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'total' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! array_key_exists('total', $validated) && (isset($validated['qte']) || isset($validated['unit_price']))) {
            $qte = $validated['qte'] ?? $commandeLine->qte;
            $unitPrice = $validated['unit_price'] ?? $commandeLine->unit_price;
            $validated['total'] = $qte * $unitPrice;
        }

        $commandeLine->update($validated);

        return response()->json($commandeLine);
    }

    public function destroy(Commande $commande, CommandeLine $commandeLine)
    {
        if ($commandeLine->commande_id !== $commande->id) {
            return response()->json(['message' => 'Line not found for this commande.'], 404);
        }

        $commandeLine->delete();

        return response()->json([], 204);
    }
}
